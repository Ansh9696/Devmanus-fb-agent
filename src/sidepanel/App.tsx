import { useState, useRef, useEffect } from "react";

const DEFAULT_POST_TEMPLATE = `🚀 DevOps Job Support Available!

Hi everyone! I provide DevOps job support with 9 years of experience. I can help with AWS, Azure DevOps, Kubernetes, Docker, Jenkins, Terraform, CI/CD, Linux, and DevSecOps.

Need help with project tasks or technical issues? DM me directly!

📱 Contact: 9479639339`;

const DEFAULT_GROUPS = [
  "DevOps, SRE, and Platform Engineering Jobs",
  "Job support , proxy interviews and trainings for US candidate s",
  "Data Engineer proxy support",
  "Data Engineer & Devops Job Support",
  "DevOps(Docker + Kubernetes) Group",
  "IT Job Support & Interview Proxy",
  "SAP projects , training, proxy, job support.",
  "Interview Proxy & Support | Data Engineer | Data Analyst | Java Full Stack"
];

const PRESETS = [
  { label: "⚡ 1 Min", mins: 1 },
  { label: "5 Min", mins: 5 },
  { label: "1 Hr", mins: 60 },
  { label: "2 Hrs", mins: 120 },
  { label: "3 Hrs", mins: 180 },
  { label: "4 Hrs", mins: 240 },
  { label: "5 Hrs", mins: 300 }
];

export default function App() {
  const [tab, setTab] = useState<"cron" | "prompt">("cron");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("Ready. Configure your custom cron schedule or post immediately.");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Cron configuration state
  const [cronEnabled, setCronEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(180);
  const [customAmount, setCustomAmount] = useState<number>(3);
  const [customUnit, setCustomUnit] = useState<"minutes" | "hours">("hours");

  const [postMessage, setPostMessage] = useState(DEFAULT_POST_TEMPLATE);
  const [targetGroups, setTargetGroups] = useState<string[]>(DEFAULT_GROUPS);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [nextRunTime, setNextRunTime] = useState<number | null>(null);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [lastRunStatus, setLastRunStatus] = useState<string>("");
  const [countdown, setCountdown] = useState<string>("");

  const portRef = useRef<chrome.runtime.Port | null>(null);
  const timerRef = useRef<number | null>(null);

  // Format interval for display
  function formatInterval(mins: number): string {
    if (mins < 60) return `${mins} Minute${mins === 1 ? "" : "s"}`;
    const hrs = mins / 60;
    return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} Hour${hrs === 1 ? "" : "s"}`;
  }

  // Load saved state from storage
  useEffect(() => {
    chrome.storage.local.get(
      [
        "cronEnabled",
        "intervalMinutes",
        "intervalHours",
        "postMessage",
        "targetGroups",
        "autoSubmit",
        "nextRunTime",
        "lastRunTime",
        "lastRunStatus",
        "lastLog"
      ],
      (res) => {
        if (res.cronEnabled !== undefined) setCronEnabled(res.cronEnabled);

        const loadedMins = res.intervalMinutes || (res.intervalHours ? res.intervalHours * 60 : 180);
        setIntervalMinutes(loadedMins);
        if (loadedMins >= 60 && loadedMins % 60 === 0) {
          setCustomAmount(loadedMins / 60);
          setCustomUnit("hours");
        } else {
          setCustomAmount(loadedMins);
          setCustomUnit("minutes");
        }

        if (res.postMessage) setPostMessage(res.postMessage);
        if (Array.isArray(res.targetGroups)) setTargetGroups(res.targetGroups);
        if (res.autoSubmit !== undefined) setAutoSubmit(res.autoSubmit);
        if (res.nextRunTime) setNextRunTime(res.nextRunTime);
        if (res.lastRunTime) setLastRunTime(res.lastRunTime);
        if (res.lastRunStatus) setLastRunStatus(res.lastRunStatus);
        if (res.lastLog) setOutput(res.lastLog);
      }
    );
  }, []);

  // Live countdown to next run
  useEffect(() => {
    const updateCountdown = () => {
      if (!cronEnabled || !nextRunTime) {
        setCountdown("Inactive");
        return;
      }
      const diff = nextRunTime - Date.now();
      if (diff <= 0) {
        setCountdown("Executing right now...");
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const timeStr = new Date(nextRunTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (hrs > 0) {
        setCountdown(`${hrs}h ${mins}m ${secs}s (at ${timeStr})`);
      } else {
        setCountdown(`${mins}m ${secs}s (at ${timeStr})`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [cronEnabled, nextRunTime]);

  // Busy timer
  useEffect(() => {
    if (busy) {
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [busy]);

  // Message dispatcher over persistent port
  function connectAndSend(msgPayload: object, initialStatus = "Connecting to agent…") {
    setBusy(true);
    setOutput(initialStatus);

    try {
      const port = chrome.runtime.connect({ name: "devmanus-agent" });
      portRef.current = port;

      port.onMessage.addListener((msg: { status: "progress" | "done" | "error"; text?: string; error?: string }) => {
        if (msg.status === "progress" && msg.text) {
          setOutput((prev) => `${prev}\n${msg.text}`);
        } else if (msg.status === "done") {
          setOutput((prev) => `${prev}\n\n✅ Complete:\n${msg.text || "Finished."}`);
          setBusy(false);
          port.disconnect();
          portRef.current = null;
          chrome.storage.local.get(["nextRunTime", "lastRunTime", "lastRunStatus"], (res) => {
            if (res.nextRunTime) setNextRunTime(res.nextRunTime);
            if (res.lastRunTime) setLastRunTime(res.lastRunTime);
            if (res.lastRunStatus) setLastRunStatus(res.lastRunStatus);
          });
        } else if (msg.status === "error") {
          setOutput((prev) => `${prev}\n\n❌ Error: ${msg.error || "Failed."}`);
          setBusy(false);
          port.disconnect();
          portRef.current = null;
        }
      });

      port.onDisconnect.addListener(() => {
        setBusy(false);
        portRef.current = null;
      });

      port.postMessage(msgPayload);
    } catch (err) {
      setOutput(err instanceof Error ? err.message : "Connection failed.");
      setBusy(false);
    }
  }

  // Update interval
  function applyInterval(mins: number) {
    const validMins = Math.max(1, Math.round(mins));
    setIntervalMinutes(validMins);
    chrome.storage.local.set({ intervalMinutes: validMins });

    if (validMins >= 60 && validMins % 60 === 0) {
      setCustomAmount(validMins / 60);
      setCustomUnit("hours");
    } else {
      setCustomAmount(validMins);
      setCustomUnit("minutes");
    }

    // If already running, automatically update active alarm with new interval
    if (cronEnabled) {
      const newNext = Date.now() + validMins * 60 * 1000;
      setNextRunTime(newNext);
      connectAndSend(
        { type: "TOGGLE_CRON", enabled: true, intervalMinutes: validMins },
        `Updating cron schedule to every ${formatInterval(validMins)}…`
      );
    }
  }

  // Handle custom number or unit change
  function handleCustomChange(amount: number, unit: "minutes" | "hours") {
    const val = Math.max(1, amount);
    setCustomAmount(val);
    setCustomUnit(unit);
    const mins = unit === "hours" ? val * 60 : val;
    applyInterval(mins);
  }

  // Toggle Cron on/off
  async function toggleCron(enable: boolean) {
    const newNext = enable ? Date.now() + intervalMinutes * 60 * 1000 : null;
    setCronEnabled(enable);
    setNextRunTime(newNext);

    await chrome.storage.local.set({
      cronEnabled: enable,
      intervalMinutes,
      postMessage,
      targetGroups,
      autoSubmit,
      nextRunTime: newNext
    });

    connectAndSend(
      { type: "TOGGLE_CRON", enabled: enable, intervalMinutes },
      enable ? `Starting cron job (Every ${formatInterval(intervalMinutes)})…` : "Stopping cron job…"
    );
  }

  // Run immediate test
  async function runAutoPostNow() {
    await chrome.storage.local.set({
      postMessage,
      targetGroups,
      autoSubmit
    });
    connectAndSend({ type: "TRIGGER_AUTO_POST_NOW" }, "🚀 Running Auto-Post routine now on Facebook…");
  }

  // Toggle group
  function toggleGroup(groupName: string) {
    setTargetGroups((prev) => {
      const next = prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName];
      chrome.storage.local.set({ targetGroups: next });
      return next;
    });
  }

  // Save message template
  async function saveMessage(newText: string) {
    setPostMessage(newText);
    await chrome.storage.local.set({ postMessage: newText });
  }

  // Manual command prompt
  function submitPrompt() {
    const value = command.trim();
    if (!value || busy) return;
    connectAndSend({ type: "RUN_COMMAND", command: value }, "Connecting to local agent…");
  }

  return (
    <main className="app">
      <header className="brand">
        <img src="/icons/logo.png" alt="Devmanus Logo" className="brand-logo" />
        <div>
          <h1>Devmanus</h1>
          <p>Facebook Auto-Poster & AI Agent</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tab-bar">
        <button
          className={`tab-btn ${tab === "cron" ? "active" : ""}`}
          onClick={() => setTab("cron")}
          disabled={busy}
        >
          ⏰ Auto-Post Cron ({formatInterval(intervalMinutes)})
        </button>
        <button
          className={`tab-btn ${tab === "prompt" ? "active" : ""}`}
          onClick={() => setTab("prompt")}
          disabled={busy}
        >
          ⚡ Custom Prompt
        </button>
      </nav>

      {tab === "cron" ? (
        <section className="cron-container">
          {/* Status Banner */}
          <div className={`status-card ${cronEnabled ? "active" : "inactive"}`}>
            <div className="status-header">
              <span className={`status-dot ${cronEnabled ? "pulse" : ""}`} />
              <span className="status-label">
                {cronEnabled ? `CRON ACTIVE · Every ${formatInterval(intervalMinutes)}` : "CRON PAUSED"}
              </span>
            </div>
            <div className="timing-grid">
              <div className="timing-item">
                <span className="timing-title">Next Scheduled Run:</span>
                <span className="timing-val">{countdown}</span>
              </div>
              <div className="timing-item">
                <span className="timing-title">Last Execution:</span>
                <span className="timing-val">
                  {lastRunTime ? `${new Date(lastRunTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${lastRunStatus || "Success"}` : "None yet"}
                </span>
              </div>
            </div>
          </div>

          {/* Cron Interval Selector */}
          <div className="section-block">
            <label>Set Posting Interval (Custom Schedule):</label>

            {/* Quick Presets */}
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.mins}
                  className={`preset-btn ${intervalMinutes === p.mins ? "selected" : ""}`}
                  onClick={() => applyInterval(p.mins)}
                  disabled={busy}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Interval Row */}
            <div className="custom-interval-row">
              <span className="custom-label">Custom:</span>
              <input
                type="number"
                min="1"
                max="1440"
                value={customAmount}
                onChange={(e) => handleCustomChange(Number(e.target.value) || 1, customUnit)}
                disabled={busy}
                className="custom-input"
              />
              <select
                value={customUnit}
                onChange={(e) => handleCustomChange(customAmount, e.target.value as "minutes" | "hours")}
                disabled={busy}
                className="custom-select"
              >
                <option value="minutes">Minute(s)</option>
                <option value="hours">Hour(s)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="btn-group">
            {cronEnabled ? (
              <button className="danger-btn" disabled={busy} onClick={() => toggleCron(false)}>
                ⏹️ Stop Cron Job
              </button>
            ) : (
              <button className="primary-btn" disabled={busy} onClick={() => toggleCron(true)}>
                ▶️ Start Cron (Every {formatInterval(intervalMinutes)})
              </button>
            )}
            <button className="run-now-btn" disabled={busy} onClick={runAutoPostNow}>
              {busy ? `Posting to FB & Groups… (${seconds}s)` : "🚀 Post Now (Immediate Test)"}
            </button>
          </div>

          {/* Group Auto-Selection List */}
          <div className="section-block">
            <div className="section-title-row">
              <label>Select Groups to Auto-Share (Up to 9):</label>
              <span className="badge">{targetGroups.length} selected</span>
            </div>
            <div className="group-list">
              {DEFAULT_GROUPS.map((grp) => {
                const checked = targetGroups.includes(grp);
                return (
                  <label key={grp} className={`group-item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup(grp)}
                      disabled={busy}
                    />
                    <span className="group-name">{grp}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Post Message Template */}
          <div className="section-block">
            <label htmlFor="postMessage">Post Content Template:</label>
            <textarea
              id="postMessage"
              rows={5}
              value={postMessage}
              onChange={(e) => saveMessage(e.target.value)}
              placeholder="Enter your promotional post message…"
              disabled={busy}
            />
          </div>

          {/* Auto-Submit Switch */}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={autoSubmit}
              onChange={(e) => {
                setAutoSubmit(e.target.checked);
                chrome.storage.local.set({ autoSubmit: e.target.checked });
              }}
              disabled={busy}
            />
            <span>Automatically click blue <strong>"Post"</strong> button (Publish without confirmation)</span>
          </label>
        </section>
      ) : (
        <section className="prompt-container">
          <div className="status">
            <span className="dot" /> Local Ollama Agent (Optimized ⚡)
          </div>
          <label htmlFor="command">What should I do?</label>
          <textarea
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter your browser automation instruction…"
            rows={4}
            disabled={busy}
          />
          <button disabled={busy || !command.trim()} onClick={submitPrompt}>
            {busy ? `Executing instruction… (${seconds}s)` : "Run instruction"}
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => connectAndSend({ type: "READ_ACTIVE_PAGE" }, "Reading active page…")}
          >
            Read current page
          </button>
        </section>
      )}

      {/* Live Activity Log */}
      <section className="output">
        <div className="output-title">Activity / Live Progress</div>
        <pre>{output}</pre>
      </section>

      <p className="footnote">
        ⚡ Devmanus local engine running via Ollama. Custom cron executes in background using Chrome Alarms.
      </p>
    </main>
  );
}