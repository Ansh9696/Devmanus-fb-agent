import { useState, useRef, useEffect } from "react";
import { checkIntegrity, TAMPER_MESSAGE } from "../security/guard";
import LockoutScreen from "./LockoutScreen";
import { getStorageItem, setStorageItem, isNativeMobile } from "../mobile/storage";
import { triggerHaptic } from "../mobile/haptics";
import { dispatchAutoPost } from "../mobile/automation-bridge";

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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [lockReason, setLockReason] = useState<string>("");

  const verifyAuthorStatus = async () => {
    try {
      const res = await checkIntegrity();
      if (res.ok) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setLockReason(res.error || TAMPER_MESSAGE);
      }
    } catch {
      setIsAuthorized(false);
      setLockReason(TAMPER_MESSAGE);
    }
  };

  useEffect(() => {
    void verifyAuthorStatus();
  }, []);

  const [output, setOutput] = useState("Ready. Configure your schedule or send post immediately.");
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

  const timerRef = useRef<number | null>(null);

  // Format interval for display
  function formatInterval(mins: number): string {
    if (mins < 60) return `${mins} Minute${mins === 1 ? "" : "s"}`;
    const hrs = mins / 60;
    return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} Hour${hrs === 1 ? "" : "s"}`;
  }

  // Load saved state from cross-platform storage (Mobile Preferences or Chrome Storage)
  useEffect(() => {
    async function loadSettings() {
      const enabled = await getStorageItem<boolean>("cronEnabled", false);
      const mins = await getStorageItem<number>("intervalMinutes", 180);
      const msg = await getStorageItem<string>("postMessage", DEFAULT_POST_TEMPLATE);
      const grps = await getStorageItem<string[]>("targetGroups", DEFAULT_GROUPS);
      const submit = await getStorageItem<boolean>("autoSubmit", true);
      const nextTime = await getStorageItem<number | null>("nextRunTime", null);
      const lastTime = await getStorageItem<number | null>("lastRunTime", null);
      const lastStat = await getStorageItem<string>("lastRunStatus", "");
      const log = await getStorageItem<string>("lastLog", "");

      setCronEnabled(enabled);
      setIntervalMinutes(mins);
      if (mins >= 60 && mins % 60 === 0) {
        setCustomAmount(mins / 60);
        setCustomUnit("hours");
      } else {
        setCustomAmount(mins);
        setCustomUnit("minutes");
      }

      setPostMessage(msg);
      setTargetGroups(grps);
      setAutoSubmit(submit);
      if (nextTime) setNextRunTime(nextTime);
      if (lastTime) setLastRunTime(lastTime);
      if (lastStat) setLastRunStatus(lastStat);
      if (log) setOutput(log);
    }

    void loadSettings();
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

  // Update interval
  async function applyInterval(mins: number) {
    void triggerHaptic();
    const validMins = Math.max(1, Math.round(mins));
    setIntervalMinutes(validMins);
    await setStorageItem("intervalMinutes", validMins);

    if (validMins >= 60 && validMins % 60 === 0) {
      setCustomAmount(validMins / 60);
      setCustomUnit("hours");
    } else {
      setCustomAmount(validMins);
      setCustomUnit("minutes");
    }

    if (cronEnabled) {
      const newNext = Date.now() + validMins * 60 * 1000;
      setNextRunTime(newNext);
      await setStorageItem("nextRunTime", newNext);
      setOutput(`⏰ Cron schedule updated to every ${formatInterval(validMins)}.`);
    }
  }

  // Handle custom number or unit change
  function handleCustomChange(amount: number, unit: "minutes" | "hours") {
    const val = Math.max(1, amount);
    setCustomAmount(val);
    setCustomUnit(unit);
    const mins = unit === "hours" ? val * 60 : val;
    void applyInterval(mins);
  }

  // Toggle Cron on/off
  async function toggleCron(enable: boolean) {
    void triggerHaptic();
    const newNext = enable ? Date.now() + intervalMinutes * 60 * 1000 : null;
    setCronEnabled(enable);
    setNextRunTime(newNext);

    await setStorageItem("cronEnabled", enable);
    await setStorageItem("intervalMinutes", intervalMinutes);
    await setStorageItem("postMessage", postMessage);
    await setStorageItem("targetGroups", targetGroups);
    await setStorageItem("autoSubmit", autoSubmit);
    await setStorageItem("nextRunTime", newNext);

    setOutput(enable ? `▶️ Cron job activated! Posting every ${formatInterval(intervalMinutes)}.` : "⏹️ Cron job deactivated.");
  }

  // Run immediate test or mobile Send Now action
  async function runAutoPostNow() {
    void triggerHaptic();
    setBusy(true);
    setOutput("🚀 Starting Facebook Auto-Post routine…");

    await setStorageItem("postMessage", postMessage);
    await setStorageItem("targetGroups", targetGroups);
    await setStorageItem("autoSubmit", autoSubmit);

    await dispatchAutoPost(postMessage, targetGroups, autoSubmit, {
      onProgress: (text) => setOutput((prev) => `${prev}\n${text}`),
      onDone: async (result) => {
        const now = Date.now();
        const nextTime = cronEnabled ? now + intervalMinutes * 60 * 1000 : null;
        setLastRunTime(now);
        setLastRunStatus("Success");
        if (nextTime) setNextRunTime(nextTime);

        await setStorageItem("lastRunTime", now);
        await setStorageItem("lastRunStatus", "Success");
        await setStorageItem("lastLog", result);
        if (nextTime) await setStorageItem("nextRunTime", nextTime);

        setOutput((prev) => `${prev}\n\n✅ Complete:\n${result}`);
        setBusy(false);
      },
      onError: (err) => {
        setOutput((prev) => `${prev}\n\n❌ Error: ${err}`);
        setBusy(false);
      },
    });
  }

  // Toggle group
  async function toggleGroup(groupName: string) {
    void triggerHaptic();
    const next = targetGroups.includes(groupName) ? targetGroups.filter((g) => g !== groupName) : [...targetGroups, groupName];
    setTargetGroups(next);
    await setStorageItem("targetGroups", next);
  }

  // Save message template
  async function saveMessage(newText: string) {
    setPostMessage(newText);
    await setStorageItem("postMessage", newText);
  }

  if (isAuthorized === false) {
    return <LockoutScreen onUnlock={() => setIsAuthorized(true)} reason={lockReason} />;
  }

  return (
    <main className="app">
      <header className="brand">
        <img src="/icons/logo.png" alt="Devmanus Logo" className="brand-logo" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1>Devmanus</h1>
            <span style={{ fontSize: "10px", color: "#34d399", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
              {isNativeMobile() ? "📱 Mobile App" : "🛡️ Author Verified"}
            </span>
          </div>
          <p>Facebook Auto-Poster & Scheduler</p>
        </div>
      </header>

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

        {/* Action Buttons (Send Now / Start Cron) */}
        <div className="btn-group">
          <button className="run-now-btn" disabled={busy} onClick={runAutoPostNow}>
            {busy ? `Posting to FB & Groups… (${seconds}s)` : "🚀 Send Post Now"}
          </button>
          {cronEnabled ? (
            <button className="danger-btn" disabled={busy} onClick={() => toggleCron(false)}>
              ⏹️ Stop Cron Job
            </button>
          ) : (
            <button className="primary-btn" disabled={busy} onClick={() => toggleCron(true)}>
              ▶️ Start Cron (Every {formatInterval(intervalMinutes)})
            </button>
          )}
        </div>

        {/* Post Message Template Editor */}
        <div className="section-block">
          <div className="section-title-row">
            <label htmlFor="postMessage">Modify Post Content:</label>
            <span className="badge">{postMessage.length} chars</span>
          </div>
          <textarea
            id="postMessage"
            rows={6}
            value={postMessage}
            onChange={(e) => saveMessage(e.target.value)}
            placeholder="Enter your promotional post message…"
            disabled={busy}
          />
        </div>

        {/* Cron Interval Selector */}
        <div className="section-block">
          <label>Posting Interval (Custom Schedule):</label>

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

        {/* Auto-Submit Switch */}
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={autoSubmit}
            onChange={async (e) => {
              setAutoSubmit(e.target.checked);
              await setStorageItem("autoSubmit", e.target.checked);
            }}
            disabled={busy}
          />
          <span>Automatically click blue <strong>"Post"</strong> button (Publish without confirmation)</span>
        </label>
      </section>

      {/* Live Activity Log */}
      <section className="output">
        <div className="output-title">Activity / Live Progress</div>
        <pre>{output}</pre>
      </section>

      <p className="footnote">
        ⚡ Devmanus automated Facebook scheduler running locally on your device.
      </p>
    </main>
  );
}