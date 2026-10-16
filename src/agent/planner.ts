export type AgentAction =
  | { type: "READ_PAGE" }
  | { type: "SUMMARIZE_PAGE" }
  | { type: "SEARCH_PAGE"; query: string }
  | { type: "NAVIGATE"; url: string }
  | { type: "CLICK_TEXT"; text: string }
  | { type: "FILL_INPUT"; label: string; value: string };

export type AgentPlan = { summary: string; actions: AgentAction[] };

export async function planTask(command: string, page: { title: string; url: string; text: string }) {
  const response = await fetch("http://127.0.0.1:3000/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, page })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "AI planning failed.");
  return data as AgentPlan;
}

export async function summarizePage(page: { title: string; url: string; text: string }) {
  const response = await fetch("http://127.0.0.1:3000/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Page summarization failed.");
  return data.summary as string;
}