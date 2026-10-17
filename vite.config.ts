import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Devmanus fb extension",
  version: "0.1.0",
  description: "Automated Facebook post scheduler and multi-group distributor.",
  permissions: ["sidePanel", "activeTab", "tabs", "scripting", "storage", "alarms"],
  host_permissions: ["*://*.facebook.com/*", "<all_urls>"],
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  action: {
    default_title: "Open Devmanus",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  side_panel: { default_path: "src/sidepanel/index.html" },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/content/content-script.ts"],
      run_at: "document_idle",
    },
  ],
});

// @ts-ignore
import { runIntegrityCheck } from "./scripts/verify.mjs";

const integrity = runIntegrityCheck();
const isTampered = !integrity.valid;

if (isTampered) {
  console.warn("\n=================================================================");
  console.warn("🚨 [DEVMANUS SECURITY GUARD] UNAUTHORIZED CODE MODIFICATION DETECTED!");
  console.warn("❌ ai use karne se koi developer nahi ban jata ladle");
  console.warn("=================================================================\n");
}

export default defineConfig({
  define: {
    __LIVE_RELOAD__: JSON.stringify(true),
    __DEVMANUS_TAMPERED__: JSON.stringify(isTampered),
    __TAMPER_MSG__: JSON.stringify("ai use karne se koi developer nahi ban jata ladle"),
  },
  plugins: [react(), crx({ manifest })],
  server: { port: 5173, strictPort: true },
});