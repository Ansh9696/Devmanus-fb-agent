export type PlannedAction =
  | { type: "READ_PAGE" }
  | { type: "NAVIGATE"; url: string }
  | { type: "CLICK_TEXT"; text: string }
  | { type: "FILL_INPUT"; label: string; value: string }
  | { type: "SEARCH_PAGE"; query: string }
  | { type: "SUMMARIZE_PAGE" };

const MAX_LABEL = 500;
const MAX_VALUE = 5000;

export function validateAction(input: unknown): PlannedAction {
  if (!input || typeof input !== "object" || !("type" in input)) {
    throw new Error("Invalid action object.");
  }
  const a = input as Record<string, unknown>;
  const str = (key: string, maxLen = MAX_LABEL) => {
    const v = a[key];
    if (typeof v !== "string" || !v.trim() || v.length > maxLen) {
      throw new Error(`Invalid ${key} value (length: ${typeof v === "string" ? v.length : 0}, max: ${maxLen}).`);
    }
    return v.trim();
  };

  switch (a.type) {
    case "READ_PAGE": return { type: "READ_PAGE" };
    case "SUMMARIZE_PAGE": return { type: "SUMMARIZE_PAGE" };
    case "NAVIGATE": {
      const raw = str("url", 2000);
      const url = new URL(raw);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        throw new Error("Only public HTTP/HTTPS URLs without embedded credentials are allowed.");
      }
      return { type: "NAVIGATE", url: url.href };
    }
    case "CLICK_TEXT": return { type: "CLICK_TEXT", text: str("text", 500) };
    case "FILL_INPUT": return { type: "FILL_INPUT", label: str("label", 500), value: str("value", MAX_VALUE) };
    case "SEARCH_PAGE": return { type: "SEARCH_PAGE", query: str("query", 500) };
    default: throw new Error("Action type is not allowed.");
  }
}