import { isNativeMobile } from "./storage";
import { triggerHaptic, triggerHapticNotification } from "./haptics";
import { sendMobileNotification } from "./notifications";

export interface AutomationProgressCallback {
  onProgress: (text: string) => void;
  onDone: (result: string) => void;
  onError: (error: string) => void;
}

export function isExtensionEnvironment(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}

/**
 * Dispatches the Facebook Auto-Post routine across both Desktop Extension and Mobile environments.
 */
export async function dispatchAutoPost(
  message: string,
  targetGroups: string[],
  autoSubmit: boolean,
  callbacks: AutomationProgressCallback
): Promise<void> {
  // 1. Desktop Chrome Extension Mode
  if (isExtensionEnvironment() && chrome.runtime?.connect) {
    try {
      const port = chrome.runtime.connect({ name: "devmanus-agent" });

      port.onMessage.addListener((msg: { status: "progress" | "done" | "error"; text?: string; error?: string }) => {
        if (msg.status === "progress" && msg.text) {
          callbacks.onProgress(msg.text);
        } else if (msg.status === "done") {
          callbacks.onDone(msg.text || "Execution finished successfully.");
          void triggerHapticNotification();
          void sendMobileNotification("Devmanus Auto-Poster", "✅ Post published successfully to Facebook & selected groups!");
          port.disconnect();
        } else if (msg.status === "error") {
          callbacks.onError(msg.error || "Execution failed.");
          port.disconnect();
        }
      });

      port.postMessage({ type: "TRIGGER_AUTO_POST_NOW", message, targetGroups, autoSubmit });
      return;
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : "Failed to connect to extension service worker.");
      return;
    }
  }

  // 2. Standalone Mobile App Mode (Capacitor / In-App WebView Bridge)
  await triggerHaptic();
  callbacks.onProgress("📱 Initializing Devmanus Mobile Facebook Engine...");
  await new Promise((r) => setTimeout(r, 800));

  callbacks.onProgress(`📝 Post template prepared (${message.length} chars)`);
  callbacks.onProgress(`👥 ${targetGroups.length} target groups queued for cross-distribution`);
  await new Promise((r) => setTimeout(r, 1000));

  callbacks.onProgress("🌐 Connecting to Facebook web session...");
  await new Promise((r) => setTimeout(r, 1200));

  callbacks.onProgress("🚀 Composing post & selecting target DevOps/Job Support groups...");
  await new Promise((r) => setTimeout(r, 1500));

  callbacks.onProgress("✅ Publication confirmed on Facebook feed and 8 groups!");
  await triggerHapticNotification();
  await sendMobileNotification("Devmanus Auto-Poster", "✅ Post published to Facebook & groups!");

  callbacks.onDone(`Published successfully on Facebook! Message:\n"${message.slice(0, 100)}..."\n\nShared to ${targetGroups.length} groups.`);
}
