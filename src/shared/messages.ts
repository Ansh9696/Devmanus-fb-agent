export type Request =
  | { type: "TRIGGER_AUTO_POST_NOW" }
  | { type: "TOGGLE_CRON"; enabled?: boolean; intervalMinutes?: number }
  | { type: "UNLOCK_SESSION"; password?: string }
  | { type: "CHECK_SECURITY_STATUS" };

export type Response =
  | { ok: true; text?: string; message?: string; result?: unknown }
  | { ok: false; error: string };