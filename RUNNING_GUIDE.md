# Devmanus Facebook Extension - Complete Running Guide

> **Quick Summary**: This step-by-step guide explains how to start, configure, test, and run the Devmanus autonomous Facebook posting extension on macOS or Windows.

---

## 📋 Pre-Flight Checklist

Before opening Chrome, ensure you have:
1. **Google Chrome** installed.
2. **Facebook account** logged in inside Chrome.
3. Node.js 20+ installed (for local development/build).

---

## 🚀 Step 1: Build & Start the Extension

You can build and run in either of two modes:

### Mode A: Native Local Mode
```bash
# Install and build extension
npm install
npm run build

# Start live development watcher
npm run dev
```

### Mode B: Docker Mode
- **On macOS / Linux**:
  ```bash
  ./docker-start.sh
  # (or: docker compose up -d)
  ```
- **On Windows**:
  Double-click **`docker-start.bat`** (or run `docker compose up -d`).

#### Verify Server is Healthy
Open this link in your browser: [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health)  
You should see:
```json
{
  "ok": true,
  "service": "devmanus-local-backend",
  "extensionConfigured": true
}
```

---

## 🧩 Step 2: Load Extension in Google Chrome

1. In Chrome, open a new tab and go to:
   ```text
   chrome://extensions
   ```
2. Turn **ON** the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Browse to this project folder and select the **`dist`** directory.
5. In Chrome's top toolbar, click the **puzzle piece (Extensions)** icon.
6. Find **Devmanus fb extension** and click the **Pin** icon to pin it to your toolbar.

---

## 📱 Step 3: Run Your First Test Post (Immediate Test)

1. Open [https://www.facebook.com](https://www.facebook.com) in Chrome and ensure you are logged in to your account.
2. Click the pinned **Devmanus** icon in your toolbar to open the **Side Panel**.
3. Under **Post Content Template**, verify or customize your promotional message.
4. Under **Select Groups to Auto-Share**, select the groups you want to cross-post to.
5. Click **"Post Now (Immediate Test)"**.
6. Observe Devmanus locate the Facebook tab, open the composer, type the text, auto-select target groups, and publish!

---

## ⏰ Step 4: Configure Recurring Scheduled Cron Posting

1. In the sidepanel under **Set Posting Interval**, choose an interval preset (e.g., `1 Min` for testing, or `3 Hrs` / `4 Hrs` for daily automation), or type a custom number.
2. Click **"Start Cron"**.
3. The status indicator will turn green and say: `CRON ACTIVE · Every X Hours`.
4. Devmanus will automatically run in the background via Chrome Alarms, even when the sidepanel is closed!
