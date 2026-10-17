import type { Request } from "../shared/messages";
import { checkIntegrity, TAMPER_MESSAGE, unlockSession } from "../security/guard";

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

// Helper: Ensure the content script is injected into the Facebook tab
export async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
    if (res?.ok) return;
  } catch {
    // If not injected, dynamically lookup the built content script from manifest
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
    } catch {
      /* ignored */
    }
  }
}

// Helper: Configure or clear the recurring alarm (supports any interval in minutes)
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
  const integrity = await checkIntegrity();
  if (!integrity.ok) {
    const err = integrity.error || TAMPER_MESSAGE;
    if (port) port.postMessage({ status: "error", error: err });
    throw new Error(err);
  }

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
    const integrity = await checkIntegrity();
    if (!integrity.ok) {
      console.error("[Devmanus Security] Alarm execution blocked:", integrity.error || TAMPER_MESSAGE);
      await chrome.storage.local.set({
        lastRunTime: Date.now(),
        lastRunStatus: `Blocked: ${integrity.error || TAMPER_MESSAGE}`
      });
      return;
    }

    console.log("[Devmanus Alarm] Cron triggered. Executing auto-post routine...");
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

// Persistent port connection for live progress and continuous execution
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "devmanus-agent") return;

  port.onMessage.addListener(
    async (msg: {
      type: "TRIGGER_AUTO_POST_NOW" | "TOGGLE_CRON" | "UNLOCK_SESSION";
      enabled?: boolean;
      intervalHours?: number;
      intervalMinutes?: number;
      password?: string;
    }) => {
      try {
        if (msg.type === "UNLOCK_SESSION") {
          const res = await unlockSession(msg.password || "");
          if (res.success) {
            port.postMessage({ status: "done", text: "Session unlocked successfully by author." });
          } else {
            port.postMessage({ status: "error", error: TAMPER_MESSAGE });
          }
          return;
        }

        // Integrity check guard on all execution commands
        const integrity = await checkIntegrity();
        if (!integrity.ok) {
          port.postMessage({
            status: "error",
            error: integrity.error || TAMPER_MESSAGE,
          });
          return;
        }

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
      } catch (error) {
        port.postMessage({
          status: "error",
          error: error instanceof Error ? error.message : "Unexpected automation error.",
        });
      }
    }
  );
});

// One-shot message listener fallback
chrome.runtime.onMessage.addListener((message: Request, _sender, sendResponse) => {
  (async () => {
    if (message.type === "CHECK_SECURITY_STATUS") {
      const integrity = await checkIntegrity();
      return { ok: integrity.ok, error: integrity.ok ? undefined : (integrity.error || TAMPER_MESSAGE) };
    }

    const integrity = await checkIntegrity();
    if (!integrity.ok) {
      throw new Error(integrity.error || TAMPER_MESSAGE);
    }

    if (message.type === "TRIGGER_AUTO_POST_NOW") {
      const report = await executeScheduledAutoPost();
      return { ok: true, message: report };
    }

    if (message.type === "TOGGLE_CRON") {
      const enabled = message.enabled ?? true;
      const intervalMinutes = message.intervalMinutes ?? 180;
      await configureCronAlarm(enabled, intervalMinutes);
      return { ok: true, message: `Cron ${enabled ? "activated" : "deactivated"}.` };
    }

    if (message.type === "UNLOCK_SESSION") {
      const res = await unlockSession(message.password || "");
      return { ok: res.success, error: res.error };
    }

    throw new Error("Unknown request type.");
  })()
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: err instanceof Error ? err.message : "Error" }));
  return true;
});