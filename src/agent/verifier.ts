export function formatExecutionReport(summary: string, results: string[]) {
  return `${summary}\n\nExecution log:\n${results.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
}