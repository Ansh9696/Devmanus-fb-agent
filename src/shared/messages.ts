export type Request =
  | { type: "READ_ACTIVE_PAGE" }
  | { type: "RUN_COMMAND"; command: string };

export type PageSnapshot = { title: string; url: string; text: string };

export type Response =
  | { ok: true; text?: string; message?: string; result?: unknown }
  | { ok: false; error: string };