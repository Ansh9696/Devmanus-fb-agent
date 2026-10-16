# Devmanus Facebook AI Assistant & Auto-Poster

<p align="center">
  <b>Autonomous Chrome Extension with Local Open-Source AI Agent & Custom Scheduled Post Automation</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/AI-100%25%20Local%20%26%20Free%20(Ollama)-brightgreen.svg" alt="Local Ollama" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green.svg" alt="Node.js 20+" />
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-orange.svg" alt="Cross Platform" />
  <img src="https://img.shields.io/badge/API%20Keys-None%20Required-success.svg" alt="Zero API Keys" />
</p>

<p align="center">
  <a href="./RUNNING_GUIDE.md"><b>📖 Read the Complete Step-by-Step Running Guide »</b></a>
</p>

---

## 🌟 Overview

**Devmanus** is a Chrome Manifest V3 extension featuring a React sidepanel, a background automation service worker, and a local Express backend powered by local open-source Large Language Models via [Ollama](https://ollama.com).

### Key Features
- 🚀 **1-Click Facebook Auto-Posting**: Automatically triggers the Facebook post composer, writes your promotional copy, and posts it.
- 👥 **Auto-Select 8 Target Groups**: Automates Facebook's "Share to groups" modal, selecting your specified DevOps, SRE, and Proxy Job Support groups (up to Facebook's 9-group limit).
- ⏰ **Custom Flexible Cron Scheduler**: Run posts on recurring intervals (`1 Min`, `5 Min`, `1 Hr`, `2 Hrs`, `3 Hrs`, `4 Hrs`, `5 Hrs`, or any custom minutes) via Chrome's background alarm system—even when the sidepanel is closed.
- 🧠 **100% Free & Local Open-Source AI**: Powered locally by `llama3.2:1b` (or `llama3.2:3b`). **Zero OpenAI API keys, zero cloud fees, and complete privacy.**
- 💻 **Cross-Platform**: Ready out-of-the-box for **macOS** (Apple Silicon M1–M4 & Intel) and **Windows 10/11** (NVIDIA GPU or CPU).

---

## 📋 System Requirements

| Tool | Minimum Version | Download Link |
|---|---|---|
| **Node.js** | 20.x or higher | [nodejs.org](https://nodejs.org/) |
| **Google Chrome** | Latest stable | [google.com/chrome](https://www.google.com/chrome/) |
| **Ollama** | Latest | [ollama.com](https://ollama.com/download) (macOS & Windows) |

---

## ⚡ Choose Your Setup Mode (Native or Docker)

You can run this project in either of two ways:
- **Option 1 (Native Local - Recommended)**: Best performance! Direct access to Apple Silicon Metal GPU or NVIDIA GPU (**~1.5s latency**).
- **Option 2 (Docker Container)**: Runs everything inside containers. Zero Node.js configuration needed on your machine.

---

### 🚀 Option 1: Native Local Run (Fastest)

#### 🍏 For macOS / Linux:
```bash
# 1-Click Setup (Dependencies, Ollama llama3.2:1b, build dist/)
chmod +x setup-mac.sh
./setup-mac.sh

# 1-Click Start
./start.sh
# (or: npm run dev:all)
```

#### 🪟 For Windows:
```cmd
REM 1-Click Setup (Double-click or run in cmd)
setup-windows.bat

REM 1-Click Start (Double-click or run in cmd)
start-windows.bat
REM (or: npm run dev:all)
```
*(PowerShell users can also run: `.\setup-windows.ps1`)*

---

### 🐳 Option 2: Docker Run (Zero Installation)

If you have Docker Desktop installed, you can start the backend and Ollama without installing Node.js:

#### 🍏 For macOS / Linux:
```bash
chmod +x docker-start.sh
./docker-start.sh
# Or simply:
docker compose up -d
```

#### 🪟 For Windows:
Double-click **`docker-start.bat`** or run:
```cmd
docker compose up -d
```

*Docker will automatically build the backend container, start Ollama, and download `llama3.2:1b`.*

---

## 🧩 Loading into Google Chrome (macOS & Windows)

1. Open **Google Chrome** and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`dist`** folder located inside this project directory.
5. In Chrome's toolbar, click the **puzzle piece (Extensions)** icon, find **Devmanus fb extension**, and click the pin icon.
6. Click the Devmanus icon to open the React side panel.

---

## 🤖 Open-Source AI Model Configuration

All AI planning runs locally on your machine via **Ollama**.

### Pre-Configured Models

| Model | Memory Footprint | Planning Latency | Best Suited For |
|---|---|---|---|
| **`llama3.2:1b`** *(Default)* | **1.3 GB** | **~1.5s** | **Mac 8GB RAM & Windows Laptops** (Zero memory pressure, lightning-fast) |
| **`llama3.2:3b`** | 2.0 GB | ~3.5s | Systems with 16GB+ RAM |
| **`devmanus-agent`** | 1.3 GB | ~1.5s | Custom tuned agent from `ollama/Modelfile` |

### How to Switch Models
Edit [`server/.env`](file:///Users/anshyadav/Downloads/devmanus-fb-extension/server/.env):
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:1b
PORT=3000
```
Change `OLLAMA_MODEL` to any model you have pulled in Ollama (e.g. `llama3.2:3b` or `qwen2.5:3b`).

### Building the Custom Tuned Agent
To build the specialized `devmanus-agent` using the embedded browser planning prompt:
- **macOS / Linux**:
  ```bash
  ./ollama/setup-models.sh
  ```
- **Windows**:
  ```cmd
  ollama create devmanus-agent -f ollama\Modelfile
  ```

---

## 👥 Pre-Configured Facebook Groups

The extension automatically navigates to "Share to groups" and selects up to 8 targeted DevOps & Job Support groups:
1. `DevOps, SRE, and Platform Engineering Jobs`
2. `Job support , proxy interviews and trainings for US candidate s`
3. `Data Engineer proxy support`
4. `Data Engineer & Devops Job Support`
5. `DevOps(Docker + Kubernetes) Group`
6. `IT Job Support & Interview Proxy`
7. `SAP projects , training, proxy, job support.`
8. `Interview Proxy & Support | Data Engineer | Data Analyst | Java Full Stack`

> **Note**: To modify the target group names, edit the group list in [`src/content/content-script.ts`](file:///Users/anshyadav/Downloads/devmanus-fb-extension/src/content/content-script.ts) and [`src/sidepanel/App.tsx`](file:///Users/anshyadav/Downloads/devmanus-fb-extension/src/sidepanel/App.tsx).

---

## ⏰ Custom Cron Scheduling

The sidepanel UI provides flexible automation scheduling:
- **Preset Quick Intervals**: Click **`1 Min`** (for immediate testing), **`5 Min`**, **`1 Hr`**, **`2 Hrs`**, **`3 Hrs`**, **`4 Hrs`**, or **`5 Hrs`**.
- **Custom Minute Input**: Enter any custom number of minutes (e.g., `45` minutes).
- **Background Persistence**: Scheduled alarms run via `chrome.alarms` in `src/background/service-worker.ts`, keeping the recurring post routine alive even when the sidepanel is closed.
- **Instant Test**: Click **"Post Now"** anytime to trigger an immediate post cycle.

---

## 📁 Repository Structure

```text
devmanus-fb-extension/
├── dist/                          # Compiled extension bundle loaded into Chrome
├── config/
│   └── ai-models.json             # AI model metadata, context sizes & hardware specs
├── ollama/
│   ├── Modelfile                  # Ollama agent definition with embedded planning prompt
│   ├── Modelfile.3b               # 3B parameter model definition
│   └── setup-models.sh            # Automated Ollama model setup script
├── server/
│   ├── src/
│   │   └── index.ts               # Express server, Ollama API connector & JSON sanitizer
│   ├── .env                       # Local server environment configuration
│   ├── .env.example               # Template for environment variables
│   └── package.json               # Backend dependencies
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Chrome MV3 Service Worker (cron & alarms engine)
│   ├── content/
│   │   └── content-script.ts      # DOM automation: composer filler & group selector
│   ├── security/
│   │   └── action-validator.ts    # Action validation allowlist & 5000-char safety limits
│   ├── sidepanel/
│   │   ├── App.tsx                # Sidepanel UI: cron presets, group toggles, manual trigger
│   │   ├── index.html             # Sidepanel HTML entry point
│   │   └── styles.css             # Sidepanel styling & animations
├── manifest.json                  # Chrome Manifest V3 manifest
├── vite.config.ts                 # CRXJS Vite bundler configuration
├── setup-mac.sh                   # 1-Click setup script for macOS / Linux
├── start.sh                       # 1-Click starter script for macOS / Linux
├── setup-windows.bat              # 1-Click setup batch file for Windows Command Prompt
├── setup-windows.ps1              # 1-Click setup script for Windows PowerShell
├── start-windows.bat              # 1-Click starter batch file for Windows
├── docker-start.sh                # 1-Click Docker starter for macOS / Linux
├── docker-start.bat               # 1-Click Docker starter for Windows
├── docker-compose.yml             # Docker Compose for containerized backend & Ollama
├── RUNNING_GUIDE.md               # Step-by-step user manual & testing guide
├── HANDOVER.md                    # In-depth project architecture & handover notes
└── README.md                      # GitHub documentation
```

---

## 🐳 Optional: Running with Docker & Docker Hub

If you or a teammate prefer to run the backend in a container instead of installing Node.js:

### 1. Run via Docker Compose
```bash
docker compose up -d --build
```
This starts:
- Devmanus Backend on `http://127.0.0.1:3000`
- Containerized Ollama on `http://127.0.0.1:11434`

### 2. Pushing the Backend Image to Docker Hub (Optional)
To share a pre-built backend image with others on Docker Hub:
```bash
# Build and tag
docker build -t your-dockerhub-username/devmanus-backend:latest server/

# Log in and push
docker login
docker push your-dockerhub-username/devmanus-backend:latest
```
*Note: Chrome extensions run natively inside the desktop browser to interact with your Facebook session, so the Chrome extension itself (`dist/`) is stored in GitHub and loaded via `chrome://extensions`.*

---

## 🛠️ Troubleshooting & FAQ

### 1. "Could not reach Ollama at http://127.0.0.1:11434"
- **macOS**: Launch the Ollama app from Applications or run `ollama serve` in Terminal.
- **Windows**: Make sure Ollama is running in the Windows System Tray (near the clock).
- Verify in browser: `http://127.0.0.1:11434/api/tags` should return your installed models.

### 2. "Could not connect to local backend at http://127.0.0.1:3000"
- Verify that `npm run dev:all` (or `start.sh` / `start-windows.bat`) is running.
- Verify in browser: `http://127.0.0.1:3000/health` should return `{"ok":true,"provider":"ollama",...}`.

### 3. "Expected visible input matching 'post', found 0"
- Ensure you are on `https://www.facebook.com` and logged in.
- Facebook's main feed must be visible so the "What's on your mind" composer box is present.

### 4. Updating code after making changes
- Run `npm run build` at the project root.
- In `chrome://extensions`, click the circular **Reload** icon on the Devmanus extension card.

---

## 🔒 Security & Privacy

- **100% Local AI**: Your Facebook posts, session data, and browsing context never leave your machine and are never sent to third-party AI cloud servers.
- **Strict Allowlist**: Browser actions are strictly limited to DOM read, click, and fill operations validated through `action-validator.ts`.
- **Intended Usage**: For authorized account management and legitimate post scheduling. Always comply with Facebook's Community Standards.
