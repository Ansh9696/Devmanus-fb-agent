import React, { useState } from "react";
import { unlockSession, TAMPER_MESSAGE } from "../security/guard";

interface LockoutScreenProps {
  onUnlock: () => void;
  reason?: string;
}

export default function LockoutScreen({ onUnlock, reason }: LockoutScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const res = await unlockSession(password);
      if (res.success) {
        onUnlock();
      } else {
        triggerError(res.error || TAMPER_MESSAGE);
      }
    } catch {
      triggerError(TAMPER_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div className="lockout-overlay">
      <div className={`lockout-card ${shake ? "shake-anim" : ""}`}>
        {/* Warning Icon with pulsating aura */}
        <div className="lockout-icon-wrapper">
          <div className="lockout-pulse" />
          <svg
            className="lockout-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        {/* Badge */}
        <span className="lockout-badge">SECURITY BREACH DETECTED</span>

        <h1 className="lockout-title">INTEGRITY CHECK FAILED</h1>

        {/* Primary Hindi Quote Message */}
        <div className="tamper-quote-card">
          <div className="quote-icon">❝</div>
          <p className="tamper-quote-text">
            ai use karne se koi developer nahi ban jata ladle
          </p>
          <div className="quote-icon right">❞</div>
        </div>

        <p className="lockout-desc">
          {reason || "This extension has been modified without cryptographic authorization from the original author. All Facebook posting and background cron routines have been terminated."}
        </p>

        {/* Author Master Password Unlock Form */}
        <form className="unlock-form" onSubmit={handleUnlock}>
          <div className="unlock-header">
            <span className="unlock-key-icon">🔐</span>
            <span>Author Master Unlock</span>
          </div>

          <div className="unlock-input-row">
            <input
              type="password"
              className="unlock-input"
              placeholder="Enter master password to authorize…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoFocus
            />
            <button
              type="submit"
              className="unlock-btn"
              disabled={busy || !password.trim()}
            >
              {busy ? "Verifying…" : "Unlock"}
            </button>
          </div>

          {error && (
            <div className="unlock-error-banner">
              ⚠️ {error}
            </div>
          )}
        </form>

        <div className="lockout-footer">
          <span>Protected by Devmanus Author Cryptographic Seal</span>
        </div>
      </div>
    </div>
  );
}
