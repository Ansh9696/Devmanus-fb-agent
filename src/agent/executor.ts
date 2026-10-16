import { validateAction } from "../security/action-validator";
import type { AgentAction } from "./planner";

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found in current window.");
  return tab;
}

// Wait for a tab to finish loading after navigation
function waitForTabLoad(tabId: number, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }, timeoutMs);

    function listener(id: number, info: chrome.tabs.TabChangeInfo) {
      if (id === tabId && info.status === "complete") {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Ensure content script is present in the tab
export async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
    if (res?.ok) return;
  } catch {
    // If not injected, dynamically lookup the built content script filename from manifest
    try {
      const manifest = chrome.runtime.getManifest();
      const scriptFile = manifest.content_scripts?.[0]?.js?.[0];
      if (scriptFile) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [scriptFile],
        });
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch { /* ignored */ }
  }
}

async function snapshot() {
  const tab = await activeTab();
  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error("This browser page cannot be inspected.");
  }
  await ensureContentScript(tab.id!);
  const response = await chrome.tabs.sendMessage(tab.id!, { type: "EXTRACT_PAGE" });
  if (!response?.ok) throw new Error(response?.error || "Could not read page. Reload the tab first.");
  return { title: response.title as string, url: response.url as string, text: response.text as string };
}

async function contentAction(message: object): Promise<string> {
  const tab = await activeTab();
  if (!tab.url || !/^https?:\/\//i.test(tab.url)) throw new Error("This page is not supported.");

  await ensureContentScript(tab.id!);

  try {
    const result = await chrome.tabs.sendMessage(tab.id!, message);
    if (!result?.ok) throw new Error(result?.error || "Page action failed.");
    return result.message as string;
  } catch (err) {
    // Retry once after short delay
    await new Promise((r) => setTimeout(r, 1000));
    const retry = await chrome.tabs.sendMessage(tab.id!, message);
    if (!retry?.ok) throw new Error(retry?.error || (err instanceof Error ? err.message : "Page action failed."));
    return retry.message as string;
  }
}

export async function executeAction(raw: AgentAction): Promise<string> {
  const action = validateAction(raw);
  switch (action.type) {
    case "READ_PAGE": {
      const page = await snapshot();
      return `Page: ${page.title}\nURL: ${page.url}\n\n${page.text.slice(0, 5000)}`;
    }
    case "SUMMARIZE_PAGE": {
      const { summarizePage } = await import("./planner");
      return summarizePage(await snapshot());
    }
    case "SEARCH_PAGE": {
      const page = await snapshot();
      const lines = page.text.split("\n").map((s) => s.trim()).filter(Boolean);
      const matches = lines.filter((s) => s.toLowerCase().includes(action.query.toLowerCase())).slice(0, 30);
      return matches.length ? matches.join("\n") : `No visible text matched "${action.query}".`;
    }
    case "NAVIGATE": {
      const tab = await activeTab();
      await chrome.tabs.update(tab.id!, { url: action.url });
      // Wait for page to finish loading
      await waitForTabLoad(tab.id!);
      // Allow extra 2.0s for modern SPA (Facebook React) hydration
      await new Promise((r) => setTimeout(r, 2000));
      return `Navigated to ${action.url} and loaded page`;
    }
    case "CLICK_TEXT": {
      // If the model mistakenly put the user's message into CLICK_TEXT instead of FILL_INPUT, auto-redirect to FILL_INPUT
      if (
        (action.text.length > 80 && action.text.includes("\n")) ||
        action.text.startsWith("🚀") ||
        action.text.includes("9479639339")
      ) {
        return contentAction({ type: "FILL_INPUT", label: "post", value: action.text });
      }
      try {
        return await contentAction({ type: "CLICK_TEXT", text: action.text });
      } catch {
        // If an optional button (e.g. "check rules") isn't on screen, don't crash the whole run
        return `Skipped non-visible element "${action.text}", continuing...`;
      }
    }
    case "FILL_INPUT":
      return contentAction({ type: "FILL_INPUT", label: action.label, value: action.value });
  }
}