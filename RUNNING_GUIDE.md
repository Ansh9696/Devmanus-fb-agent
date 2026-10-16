# Devmanus Facebook AI Extension - Complete Running Guide

> **Quick Summary**: This step-by-step guide explains how to start, configure, test, and run the Devmanus autonomous Facebook posting extension on macOS or Windows.

---

## 📋 Pre-Flight Checklist

Before opening Chrome, ensure you have:
1. **Google Chrome** installed.
2. **Facebook account** logged in inside Chrome.
3. **Ollama** running locally (or running in Docker).

---

## 🚀 Step 1: Start the Backend Server

You can run the backend in either of two modes:

### Mode A: Native Local Mode (Fastest - Metal GPU Acceleration)
- **On macOS / Linux**:
  ```bash
  ./start.sh
  # (or: npm run dev:all)
  ```
- **On Windows**:
  Double-click **`start-windows.bat`** (or run `npm run dev:all` in Command Prompt).

### Mode B: Docker Mode (Zero Node.js Dependency)
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
  "provider": "ollama",
  "model": "llama3.2:1b",
  "ollamaOnline": true
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
3. In the side panel, look at the **"Post Message Template"** box:
   - Your DevOps promotional text and phone number are already pre-filled.
   - You can edit the text or phone number anytime.
4. Under **"Target Groups"**, verify the 8 pre-configured groups are checked.
5. Click the blue **"🚀 Post Now (Test Run)"** button.
6. Watch Devmanus automate the browser in real time:
   - 🔍 Connects to your Facebook tab.
   - 📝 Opens the post composer box (*"What's on your mind?"*).
   - ✍️ Types your formatted message with emojis and phone number.
   - 👥 Opens the *Share to groups* modal and auto-selects your target DevOps groups.
   - 🚀 Clicks the blue *Post* button to publish!

---

## ⏰ Step 4: Activating the Recurring Automated Cron Job

To have Facebook posts publish automatically every few minutes or hours:

1. In the side panel under **"Schedule Interval"**, choose your frequency:
   - Quick presets: **`1 Min`** (for fast testing), **`5 Min`**, **`1 Hr`**, **`2 Hrs`**, **`3 Hrs`**, **`4 Hrs`**, or **`5 Hrs`**.
   - Custom input: Type any custom number of minutes or hours (e.g., `45` minutes or `3` hours).
2. Click the green **"▶️ Start Cron Job"** button.
3. The status indicator will turn **green (Active)** and a **live countdown timer** will show:
   ```text
   Next Post: 2h 59m 45s (at 07:15:00 AM)
   ```
4. **You can now close the side panel or work on other tabs!**
   - Chrome's background service worker (`chrome.alarms`) will keep the schedule running.
   - When the alarm triggers, Devmanus will automatically run the posting routine and update the log.

To stop the recurring schedule anytime, simply click the red **"⏹ Stop Cron Job"** button.

---

## 🧠 Step 5: Using AI Prompt Mode (Custom Commands)

You can also ask the AI to perform custom browser actions or summarize pages:
1. At the top of the side panel, switch from **"Auto-Post Cron"** to **"AI Prompt Mode"**.
2. Click **"Read current page"** to get a 2-second summary of whatever website you are viewing.
3. Or type a custom command, such as:
   ```text
   Post this update to Facebook: DevOps Workshop starts this Saturday! Register now.
   ```
4. Click **"Run instruction"** to generate the action plan and execute.

---

## 🛠️ Step 6: Troubleshooting & FAQ

| Problem | Cause | Solution |
|---|---|---|
| **"Could not connect to backend at http://127.0.0.1:3000"** | The backend server is not running | Run `./start.sh` (or `start-windows.bat` on Windows) and ensure terminal is open. |
| **"Ollama server is not responding"** | Local Ollama daemon is closed | Open the Ollama desktop app, or run `ollama serve` in a terminal. |
| **"Expected visible input matching 'post', found 0"** | Facebook is not open or not logged in | Open `https://www.facebook.com` in a tab and verify your feed is visible. |
| **"Auto-post failed in Facebook tab"** | Facebook changed tab or dialog was blocked | Keep the Facebook tab open, reload the page (`Cmd+R` / `F5`), and retry. |
| **Code changes not appearing in Chrome** | Extension was not reloaded after edits | Run `npm run build`, go to `chrome://extensions`, and click the circular **Reload** icon on Devmanus. |

---

## 🔒 Security & Best Practices
- **Never share API keys in public**: Devmanus uses 100% free local Ollama, so zero API keys are stored or needed.
- **Group Limits**: Facebook allows sharing to a maximum of 9 groups per post. Devmanus is pre-configured to stay within this limit (8 groups).
- **Posting Frequency**: For account safety, an interval of 2 to 4 hours is recommended for social media automation.
