import type { Request } from "../shared/messages";
import { executeAction, ensureContentScript } from "../agent/executor";
import { planTask, summarizePage } from "../agent/planner";
import { formatExecutionReport } from "../agent/verifier";
import type { AgentAction } from "../agent/planner";

export const ALARM_NAME = "devmanus-fb-auto-post";

export const DEFAULT_POST_MESSAGE = `🚀 DevOps Job Support Available!

Hi everyone! I provide DevOps job support with 9 years of experience. I can help with AWS, Azure DevOps, Kubernetes, Docker, Jenkins, Terraform, CI/CD, Linux, and DevSecOps.

Need help with project tasks or technical issues? DM me directly!

📱 Contact: 9479639339`;

export const DEFAULT_TARGET_GROUPS = [
  "DevOps, SRE, and Platform Engineering Jobs",
  "Job support , proxy interviews and trainings for US candidate s",
  "Data Engineer proxy support",
  "Data Engineer & Devops Job Support",
  "DevOps(Docker + Kubernetes) Group",
  "IT Job Support & Interview Proxy",
  "SAP projects , training, proxy, job support.",
  "Interview Proxy & Support | Data Engineer | Data Analyst | Java Full Stack"
];

// Helper: Configure or clear the recurring alarm (supports any interval in minutes: 1 min, 5 min, 60 min, 120 min, 180 min, etc.)
export async function configureCronAlarm(enabled: boolean, intervalMinutes = 180) {
  await chrome.alarms.clear(ALARM_NAME);
  if (enabled) {
    const period = Math.max(1, Math.round(intervalMinutes));
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: period,
      delayInMinutes: period
    });
    const nextRunTime = Date.now() + period * 60 * 1000;
    await chrome.storage.local.set({
      cronEnabled: true,
      intervalMinutes: period,
      nextRunTime
    });
  } else {
    await chrome.storage.local.set({
      cronEnabled: false,
      nextRunTime: null
    });
  }
}

// Execute the scheduled auto-post routine
export async function executeScheduledAutoPost(port?: chrome.runtime.Port): Promise<string> {
  const notify = (text: string) => {
    if (port) port.postMessage({ status: "progress", text });
  };

  const storage = await chrome.storage.local.get([
    "postMessage",
    "targetGroups",
    "autoSubmit",
    "intervalMinutes",
    "intervalHours"
  ]);

  const intervalMinutes = storage.intervalMinutes || (storage.intervalHours ? storage.intervalHours * 60 : 180);
  const timeDesc = intervalMinutes < 60 ? `${intervalMinutes}m` : `${(intervalMinutes / 60).toFixed(1).replace(/\.0$/, "")}h`;
  notify(`⏰ Initiating automated Facebook post routine (Interval: ${timeDesc})...`);

  const message = storage.postMessage || DEFAULT_POST_MESSAGE;
  const targetGroups = storage.targetGroups || DEFAULT_TARGET_GROUPS;
  const autoSubmit = storage.autoSubmit !== false;

  notify("🔍 Finding or opening Facebook tab...");
  const tabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
  let tabId: number;

  if (tabs.length > 0 && tabs[0]?.id) {
    tabId = tabs[0].id;
    await chrome.tabs.update(tabId, { active: true });
    notify("Connected to open Facebook tab.");
  } else {
    notify("Opening https://www.facebook.com/ ...");
    const newTab = await chrome.tabs.create({ url: "https://www.facebook.com/", active: true });
    tabId = newTab.id!;
    await new Promise((r) => setTimeout(r, 4500));
  }

  notify("Injecting automation scripts...");
  await ensureContentScript(tabId);
  await new Promise((r) => setTimeout(r, 1200));

  notify("📝 Composing post, selecting your DevOps & Job Support groups, and preparing publication...");
  const result = await chrome.tabs.sendMessage(tabId, {
    type: "RUN_AUTO_POST",
    message,
    selectGroups: true,
    groupKeywords: targetGroups,
    autoSubmit
  });

  if (!result?.ok) {
    throw new Error(result?.error || "Auto-post routine failed in Facebook tab.");
  }

  const now = Date.now();
  const nextRunTime = now + intervalMinutes * 60 * 1000;
  await chrome.storage.local.set({
    lastRunTime: now,
    lastRunStatus: "Success",
    nextRunTime,
    lastLog: result.message
  });

  notify("✅ Scheduled auto-post execution finished successfully!");
  return result.message as string;
}

// Alarm event listener (fires in background even when sidepanel is closed)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log("[Devmanus Alarm] 3-Hour Cron triggered. Executing auto-post routine...");
    try {
      await executeScheduledAutoPost();
    } catch (err) {
      console.error("[Devmanus Alarm] Execution failed:", err);
      await chrome.storage.local.set({
        lastRunTime: Date.now(),
        lastRunStatus: `Failed: ${err instanceof Error ? err.message : "Error"}`
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  // Default storage setup
  const cur = await chrome.storage.local.get(["postMessage", "targetGroups", "intervalHours"]);
  if (!cur.postMessage) {
    await chrome.storage.local.set({
      postMessage: DEFAULT_POST_MESSAGE,
      targetGroups: DEFAULT_TARGET_GROUPS,
      intervalHours: 3,
      autoSubmit: true
    });
  }
});

async function getActivePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error("Open a regular HTTP/HTTPS website first.");
  }
  const tabId = tab.id;

  try {
    const result = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
    if (!result?.ok) throw new Error(result?.error || "Page inspection failed.");
    return { title: result.title as string, url: result.url as string, text: result.text as string };
  } catch {
    // Dynamic script injection fallback
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          if ((window as any).__devmanus_injected) return;
          (window as any).__devmanus_injected = true;
          chrome.runtime.onMessage.addListener((msg: { type: string }, _s, sendResponse: (r: unknown) => void) => {
            if (msg?.type === "EXTRACT_PAGE") {
              sendResponse({
                ok: true,
                title: document.title,
                url: location.href,
                text: (document.body?.innerText ?? "").slice(0, 12000),
              });
            }
            return true;
          });
        },
      });
    } catch { /* ignored */ }
    try {
      const result2 = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
      if (!result2?.ok) throw new Error(result2?.error || "Page inspection failed.");
      return { title: result2.title as string, url: result2.url as string, text: result2.text as string };
    } catch {
      throw new Error("Cannot read this page. Please reload the tab and try again.");
    }
  }
}

// Persistent port connection for live progress and eliminating the 30-second timeout
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "devmanus-agent") return;

  port.onMessage.addListener(
    async (msg: {
      type: "RUN_COMMAND" | "READ_ACTIVE_PAGE" | "TRIGGER_AUTO_POST_NOW" | "TOGGLE_CRON";
      command?: string;
      enabled?: boolean;
      intervalHours?: number;
      intervalMinutes?: number;
    }) => {
      try {
        if (msg.type === "TRIGGER_AUTO_POST_NOW") {
          const report = await executeScheduledAutoPost(port);
          port.postMessage({ status: "done", text: report });
          return;
        }

        if (msg.type === "TOGGLE_CRON") {
          const enabled = msg.enabled ?? true;
          const intervalMinutes = msg.intervalMinutes ?? (msg.intervalHours ? msg.intervalHours * 60 : 180);
          await configureCronAlarm(enabled, intervalMinutes);
          const timeLabel =
            intervalMinutes < 60
              ? `${intervalMinutes} minute(s)`
              : `${(intervalMinutes / 60).toFixed(1).replace(/\.0$/, "")} hour(s)`;
          port.postMessage({
            status: "done",
            text: enabled
              ? `Cron job activated! Automatically posting every ${timeLabel} to your Facebook page & selected groups.`
              : "Cron job deactivated."
          });
          return;
        }

        if (msg.type === "READ_ACTIVE_PAGE") {
          port.postMessage({ status: "progress", text: "📖 Reading current page..." });
          const page = await getActivePage();
          port.postMessage({ status: "progress", text: "🧠 Summarizing with local Ollama..." });
          const summary = await summarizePage(page);
          port.postMessage({ status: "done", text: `${page.title}\n${page.url}\n\n${summary}` });
          return;
        }

        if (msg.type === "RUN_COMMAND") {
          const cmd = msg.command?.trim() || "";
          if (!cmd) throw new Error("Enter a valid instruction.");

          port.postMessage({ status: "progress", text: "🔍 Reading active page context..." });
          const page = await getActivePage();

          port.postMessage({ status: "progress", text: "🧠 Planning browser actions with local Ollama..." });
          const plan = await planTask(cmd, page);

          if (!Array.isArray(plan.actions)) {
            throw new Error("AI returned an invalid plan structure.");
          }

          port.postMessage({
            status: "progress",
            text: `📋 Plan ready: "${plan.summary}"\nExecuting ${plan.actions.length} action(s)...`,
          });

          const results: string[] = [];
          for (let i = 0; i < plan.actions.length; i++) {
            const action = plan.actions[i] as AgentAction;
            port.postMessage({
              status: "progress",
              text: `▶️ [Action ${i + 1}/${plan.actions.length}] Executing ${action.type}...`,
            });
            const res = await executeAction(action);
            results.push(res);
            // Allow DOM mutations and modal animations to settle between actions
            await new Promise((r) => setTimeout(r, 1200));
          }

          port.postMessage({ status: "done", text: formatExecutionReport(plan.summary, results) });
        }
      } catch (error) {
        port.postMessage({
          status: "error",
          error: error instanceof Error ? error.message : "Unexpected automation error.",
        });
      }
    }
  );
});

// Legacy one-shot message listener fallback
chrome.runtime.onMessage.addListener((message: Request, _sender, sendResponse) => {
  (async () => {
    if (message.type === "READ_ACTIVE_PAGE") {
      const page = await getActivePage();
      const summary = await summarizePage(page);
      return { ok: true, text: `${page.title}\n${page.url}\n\n${summary}` };
    }
    if (message.type === "RUN_COMMAND") {
      const page = await getActivePage();
      const plan = await planTask(message.command, page);
      const results: string[] = [];
      for (const act of plan.actions as AgentAction[]) {
        results.push(await executeAction(act));
      }
      return { ok: true, text: formatExecutionReport(plan.summary, results) };
    }
    throw new Error("Unknown request type.");
  })()
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: err instanceof Error ? err.message : "Error" }));
  return true;
});