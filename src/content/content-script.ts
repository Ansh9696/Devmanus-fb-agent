type ContentRequest =
  | { type: "EXTRACT_PAGE" }
  | { type: "CLICK_TEXT"; text: string }
  | { type: "FILL_INPUT"; label: string; value: string }
  | {
      type: "RUN_AUTO_POST";
      message: string;
      selectGroups?: boolean;
      groupKeywords?: string[];
      autoSubmit?: boolean;
    };

function visible(el: Element): boolean {
  const node = el as HTMLElement;
  const style = getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function extractPage() {
  return {
    title: document.title,
    url: location.href,
    text: (document.body?.innerText ?? "").slice(0, 12000),
  };
}

function clickText(text: string) {
  const needle = text.trim().toLowerCase();
  if (!needle) throw new Error("Click target cannot be empty.");

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "button, a, [role='button'], input[type='button'], input[type='submit'], [role='link'], [role='tab'], span, div, h2, h3"
    )
  ).filter((el) => {
    if (!visible(el)) return false;
    // Don't click giant wrapper containers
    if ((el.tagName === "DIV" || el.tagName === "SECTION") && el.clientHeight > 250 && el.clientWidth > 400) {
      return false;
    }
    const content = (
      el.innerText ||
      el.getAttribute("aria-label") ||
      (el as HTMLInputElement).value ||
      el.getAttribute("title") ||
      ""
    ).trim().toLowerCase();
    return content.includes(needle);
  });

  if (candidates.length === 0) {
    const isComposerTrigger =
      needle.includes("write something") ||
      needle.includes("what's on your mind") ||
      needle.includes("create a post") ||
      needle.includes("post composer") ||
      needle.includes("composer") ||
      needle.includes("कुछ लिखें") ||
      needle.includes("मन में क्या है");

    if (isComposerTrigger) {
      void triggerSocialComposer();
      return `Triggered post composer for "${text}"`;
    }

    throw new Error(`No visible element found matching "${text}".`);
  }

  // Prioritize buttons / links
  const prioritized =
    candidates.find((el) =>
      ["BUTTON", "A"].includes(el.tagName) || el.getAttribute("role") === "button"
    ) || candidates[0];

  prioritized.scrollIntoView({ behavior: "smooth", block: "center" });
  prioritized.focus?.();
  prioritized.click();

  // Dispatch mouse events to ensure single page apps register the click
  prioritized.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  prioritized.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

  return `Clicked: "${text}"`;
}

// Poll for an active composer or modal dialog (handles animation delays)
async function pollForComposer(timeoutMs = 4000): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // 1. Inside open modal dialog (Facebook, Twitter/X, LinkedIn)
    const inDialog = document.querySelector<HTMLElement>(
      "[role='dialog'] [contenteditable='true'], [role='dialog'] [role='textbox'], [role='dialog'] div[data-lexical-editor='true'], [role='dialog'] [data-contents='true'], [role='dialog'] textarea"
    );
    if (inDialog && visible(inDialog)) {
      return inDialog;
    }

    // 2. Any active inline contenteditable editor with lexical/textbox role
    const inline = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-pagelet*='Composer'] [contenteditable='true'], div[data-lexical-editor='true'], [aria-label*='Write something'][contenteditable='true'], [aria-label*=\"What's on your mind\"][contenteditable='true'], div[role='textbox'][contenteditable='true'], [contenteditable='true']"
      )
    ).find(visible);
    if (inline) {
      return inline;
    }

    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Automatically triggers Facebook/Social media post modals if not already open
async function triggerSocialComposer(): Promise<HTMLElement | null> {
  // If stuck on Facebook error page ("यह कंटेंट अभी उपलब्ध नहीं है"), click "फ़ीड पर जाएँ" to recover to the working feed
  const errorFeedBtn = Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button']")).find((el) => {
    const t = (el.innerText || "").trim().toLowerCase();
    return t.includes("फ़ीड पर जाएँ") || t.includes("go to feed") || t.includes("न्यूज़ फ़ीड");
  });
  if (errorFeedBtn && visible(errorFeedBtn)) {
    errorFeedBtn.click();
    await new Promise((r) => setTimeout(r, 2500));
  }

  // Direct Facebook composer selectors (English + Hindi + Language-agnostic)
  const fbDirectSelectors = [
    "[data-pagelet*='GroupInlineComposer'] [role='button']",
    "[data-pagelet*='FeedComposer'] [role='button']",
    "[data-pagelet*='Composer'] [role='button']",
    "[aria-label*='Write something']",
    "[aria-label*=\"What's on your mind\"]",
    "[aria-label*='कुछ लिखें']",
    "[aria-label*='कुछ लिखिए']",
    "[aria-label*='आपके मन में क्या है']",
    "[aria-label*='Create a public post']",
    "[aria-label*='Create a post']",
    "div[role='button'][aria-label*='Post']",
    "div[role='button'][aria-label*='पोस्ट']",
  ];

  for (const sel of fbDirectSelectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && visible(el)) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.click();
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      const found = await pollForComposer(2500);
      if (found) return found;
    }
  }

  // Text-based fallback search (English & Hindi) - strictly leaf/button elements
  const textTriggers = Array.from(
    document.querySelectorAll<HTMLElement>("div[role='button'], [role='button'], button, span, div")
  ).filter((el) => {
    if (!visible(el)) return false;
    // Discard large containers
    if (el.clientHeight > 140 || el.clientWidth > 800) return false;
    if (el.childElementCount > 4) return false;

    const txt = (
      el.innerText ||
      el.getAttribute("aria-label") ||
      el.getAttribute("placeholder") ||
      ""
    ).trim().toLowerCase();

    const isTrigger =
      txt.includes("write something") ||
      txt.includes("what's on your mind") ||
      txt.includes("create a post") ||
      txt.includes("create a public post") ||
      txt.includes("start a post") ||
      txt.includes("कुछ लिखें") ||
      txt.includes("कुछ लिखिए") ||
      txt.includes("मन में क्या है");

    return isTrigger && txt.length < 100;
  });

  // Sort candidates so explicit buttons and leaf nodes come first
  textTriggers.sort((a, b) => {
    const aIsBtn = a.tagName === "BUTTON" || a.getAttribute("role") === "button" ? 0 : 1;
    const bIsBtn = b.tagName === "BUTTON" || b.getAttribute("role") === "button" ? 0 : 1;
    if (aIsBtn !== bIsBtn) return aIsBtn - bIsBtn;
    return a.childElementCount - b.childElementCount;
  });

  if (textTriggers.length > 0) {
    const trigger = textTriggers[0];
    trigger.scrollIntoView({ behavior: "smooth", block: "center" });
    trigger.click();
    trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    trigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    const found = await pollForComposer(3000);
    if (found) return found;
  }

  return null;
}

async function fillInput(label: string, value: string): Promise<string> {
  const needle = label.trim().toLowerCase();

  const isPostRelated =
    needle.includes("post") ||
    needle.includes("composer") ||
    needle.includes("message") ||
    needle.includes("content") ||
    needle.includes("write") ||
    needle === "";

  let target: HTMLElement | null = null;

  if (isPostRelated) {
    // 1. Poll for an already open dialog or composer (e.g. opened by previous CLICK_TEXT)
    target = await pollForComposer(2500);

    // 2. If not open yet, automatically click the social composer trigger and poll again
    if (!target) {
      target = await triggerSocialComposer();
    }
  }

  // 3. Fallback for non-post inputs (e.g. search boxes, form fields)
  if (!target) {
    const selector = [
      "input:not([type='hidden']):not([type='password'])",
      "textarea",
      "[contenteditable='true']",
      "[role='textbox']",
    ].join(", ");

    const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      if (!visible(el)) return false;
      const asInput = el as HTMLInputElement;
      if (asInput.disabled || asInput.readOnly) return false;

      const desc = [
        el.id,
        el.getAttribute("aria-label"),
        el.getAttribute("placeholder"),
        el.getAttribute("name"),
        el.getAttribute("title"),
        el.innerText || "",
      ]
        .join(" ")
        .toLowerCase();

      return !needle || desc.includes(needle);
    });

    if (candidates.length > 0) {
      target = candidates[0];
    }
  }

  if (!target) {
    throw new Error(`Expected visible input matching "${label}", found 0. Please make sure the composer or input is visible on screen.`);
  }

  // Focus and insert text
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.focus();

  // If contenteditable (Facebook, LinkedIn, X rich-text editor)
  if (target.isContentEditable || target.getAttribute("role") === "textbox") {
    // Clear existing contents if any
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const success = document.execCommand("insertText", false, value);
    if (!success) {
      target.textContent = value;
    }
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return `Filled post composer with message (${value.slice(0, 35)}...)`;
  }

  // Standard input / textarea
  const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(
    inputEl instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  )?.set;

  if (setter) {
    setter.call(inputEl, value);
  } else {
    inputEl.value = value;
  }

  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  return `Filled input matching "${label}" (${value.slice(0, 35)}...)`;
}

// Auto-select Facebook groups inside the "Share to groups" modal
async function autoSelectFacebookGroups(targetKeywords: string[] = []): Promise<string> {
  // Step 1: In the active composer dialog, click "Share to groups"
  const shareTriggers = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='dialog'] [role='button'], [role='dialog'] div[role='button'], [role='dialog'] span, [role='dialog'] div"
    )
  ).filter((el) => {
    if (!visible(el)) return false;
    if (el.clientHeight > 120 || el.clientWidth > 650) return false;
    const txt = (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase();
    return (
      (txt.includes("share to groups") || txt.includes("ग्रुप में शेयर") || txt.includes("share in groups")) &&
      txt.length < 80
    );
  });

  if (shareTriggers.length === 0) {
    return "Skipped group selection (Share to groups option not found in composer)";
  }

  const trigger = shareTriggers.find((el) => el.getAttribute("role") === "button") || shareTriggers[0];
  trigger.scrollIntoView({ behavior: "smooth", block: "center" });
  trigger.click();
  trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  trigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

  // Step 2: Wait for the "Share to groups" modal to appear
  let groupsModal: HTMLElement | null = null;
  const startWait = Date.now();
  while (Date.now() - startWait < 5000) {
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>("[role='dialog']")).filter(visible);
    const found = dialogs.reverse().find((d) => {
      const text = (d.innerText || "").toLowerCase();
      return (
        text.includes("share to groups") ||
        text.includes("select groups") ||
        text.includes("post in up to 9 groups")
      );
    });
    if (found) {
      groupsModal = found;
      break;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!groupsModal) {
    return "Opened groups menu, but modal dialog did not finish loading in time.";
  }

  await new Promise((r) => setTimeout(r, 800));

  // Step 3: Match and select groups
  const defaultKeywords = [
    "devops",
    "job support",
    "proxy",
    "kubernetes",
    "docker",
    "sre",
    "platform",
    "it job",
    "data engineer",
    "interview",
    "training"
  ];
  const activeTargets = (targetKeywords.length > 0 ? targetKeywords : defaultKeywords).map((k) =>
    k.trim().toLowerCase()
  );

  const checkboxes = Array.from(
    groupsModal.querySelectorAll<HTMLElement>(
      "[role='checkbox'], input[type='checkbox'], div[aria-checked]"
    )
  ).filter(visible);

  let selectedCount = 0;

  if (checkboxes.length > 0) {
    for (const box of checkboxes) {
      if (selectedCount >= 9) break; // Facebook allows up to 9 groups

      const row = (box.closest("[role='listitem'], div[role='button'], div") || box.parentElement) as HTMLElement | null;
      const rowText = (row?.innerText || box.getAttribute("aria-label") || "").toLowerCase();

      const matches = activeTargets.some((target) => rowText.includes(target));
      const isChecked = box.getAttribute("aria-checked") === "true" || (box as HTMLInputElement).checked;

      if (matches && !isChecked) {
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        box.click();
        selectedCount++;
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  // Fallback: If checkboxes weren't selected via role, click rows matching group names
  if (selectedCount === 0) {
    const rows = Array.from(
      groupsModal.querySelectorAll<HTMLElement>(
        "div[role='button'], div[role='listitem'], div[tabindex='0']"
      )
    ).filter((r) => visible(r) && r.clientHeight < 100 && r.clientHeight > 30);

    for (const row of rows) {
      if (selectedCount >= 9) break;
      const text = (row.innerText || "").toLowerCase();
      const matches = activeTargets.some((target) => text.includes(target));
      if (matches) {
        const box = row.querySelector<HTMLElement>("[role='checkbox'], input[type='checkbox']");
        const targetToClick = box || row;
        targetToClick.click();
        selectedCount++;
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  // Step 4: Close modal / save selection
  await new Promise((r) => setTimeout(r, 600));
  const doneBtn = Array.from(
    groupsModal.querySelectorAll<HTMLElement>(
      "[role='dialog'] div[role='button'], [role='dialog'] button, [aria-label*='Done'], [aria-label*='Save']"
    )
  ).find((el) => {
    if (!visible(el)) return false;
    const t = (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase();
    return t === "done" || t === "save" || t === "हो गया" || t === "सेव करें" || t.includes("save") || t.includes("done");
  });

  if (doneBtn) {
    doneBtn.click();
  } else {
    // If no save button, click (X) close icon
    const closeBtn = groupsModal.querySelector<HTMLElement>(
      "[aria-label='Close'], [aria-label='बंद करें'], div[role='button'][aria-label*='Close']"
    );
    if (closeBtn && visible(closeBtn)) {
      closeBtn.click();
    }
  }

  await new Promise((r) => setTimeout(r, 1000));
  return `Auto-selected ${selectedCount} target group(s) (DevOps, Job support, Cloud & IT proxy)`;
}

// Click the blue "Post" button in the Facebook composer dialog
async function submitFacebookPost(): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000));

  const dialogs = Array.from(document.querySelectorAll<HTMLElement>("[role='dialog']")).filter(visible);
  const composer = dialogs[0] || document.body;

  const postButtons = Array.from(
    composer.querySelectorAll<HTMLElement>(
      "[aria-label='Post'], div[role='button'], button"
    )
  ).filter((el) => {
    if (!visible(el)) return false;
    const txt = (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase();
    return (txt === "post" || txt === "पोस्ट करें" || txt === "पोस्ट") && el.clientHeight < 70 && el.clientWidth > 50;
  });

  if (postButtons.length === 0) {
    throw new Error("Could not find the blue 'Post' button in the composer modal.");
  }

  const postBtn = postButtons[postButtons.length - 1];
  postBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  postBtn.focus();
  postBtn.click();
  postBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  postBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

  return "Published post to your Facebook page and selected groups!";
}

// Orchestrates the complete automated post routine
async function runAutoPostRoutine(config: {
  message: string;
  selectGroups?: boolean;
  groupKeywords?: string[];
  autoSubmit?: boolean;
}): Promise<string> {
  const steps: string[] = [];

  // 1. Open composer
  let composer = await pollForComposer(2000);
  if (!composer) {
    composer = await triggerSocialComposer();
  }
  if (!composer) {
    throw new Error("Could not open Facebook composer. Make sure Facebook feed is loaded.");
  }
  steps.push("1. Opened Facebook post composer");
  await new Promise((r) => setTimeout(r, 1200));

  // 2. Fill post message
  const fillRes = await fillInput("post", config.message);
  steps.push(`2. ${fillRes}`);
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Auto-select groups if requested
  if (config.selectGroups !== false) {
    const grpRes = await autoSelectFacebookGroups(config.groupKeywords || []);
    steps.push(`3. ${grpRes}`);
    await new Promise((r) => setTimeout(r, 1200));
  }

  // 4. Submit post if autoSubmit is enabled
  if (config.autoSubmit) {
    const postRes = await submitFacebookPost();
    steps.push(`4. ${postRes}`);
  } else {
    steps.push("4. Post & groups prepared. Ready for your review & approval.");
  }

  return steps.join("\n");
}

import { checkIntegrity, TAMPER_MESSAGE } from "../security/guard";

function showTamperOverlay(text: string) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("devmanus-tamper-guard-banner");
  if (existing) return;
  const banner = document.createElement("div");
  banner.id = "devmanus-tamper-guard-banner";
  banner.innerHTML = `
    <div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999999;background:linear-gradient(135deg, #7f1d1d, #450a0a);border:2px solid #ef4444;box-shadow:0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(239,68,68,0.5);color:#fff;padding:16px 24px;border-radius:12px;font-family:system-ui,sans-serif;max-width:550px;text-align:center;">
      <div style="font-size:18px;font-weight:800;color:#fca5a5;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;">
        <span>🚨</span> UNAUTHORIZED CODE TAMPERING DETECTED!
      </div>
      <div style="font-size:15px;font-weight:700;color:#fef08a;line-height:1.4;margin-bottom:6px;">
        "${text}"
      </div>
      <div style="font-size:12px;color:#fca5a5;opacity:0.9;">
        Devmanus execution disabled. Only the authorized author with the master password can run modified builds.
      </div>
    </div>
  `;
  document.body?.appendChild(banner);
}

chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
  (async () => {
    try {
      const integrity = await checkIntegrity();
      if (!integrity.ok) {
        const msg = integrity.error || TAMPER_MESSAGE;
        showTamperOverlay(msg);
        sendResponse({ ok: false, error: msg });
        return;
      }

      if (message?.type === "EXTRACT_PAGE") {
        sendResponse({ ok: true, ...extractPage() });
      } else if (message?.type === "CLICK_TEXT") {
        sendResponse({ ok: true, message: clickText(message.text) });
      } else if (message?.type === "FILL_INPUT") {
        const msg = await fillInput(message.label, message.value);
        sendResponse({ ok: true, message: msg });
      } else if (message?.type === "RUN_AUTO_POST") {
        const report = await runAutoPostRoutine({
          message: message.message,
          selectGroups: message.selectGroups,
          groupKeywords: message.groupKeywords,
          autoSubmit: message.autoSubmit,
        });
        sendResponse({ ok: true, message: report });
      }
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Content action failed." });
    }
  })();
  return true;
});