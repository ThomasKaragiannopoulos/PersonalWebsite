import type { AgentEvent } from "./types";

export async function streamQuery(
  query: string,
  baseUrl: string,
  onEvent: (event: AgentEvent) => void,
): Promise<void> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        onEvent(JSON.parse(raw) as AgentEvent);
      } catch { /* malformed line */ }
    }
  }
}

export async function fetchSuggested(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/suggested`);
    if (!response.ok) return [];
    const data = await response.json() as { queries?: string[] };
    return data.queries ?? [];
  } catch {
    return [];
  }
}

export async function checkHealth(baseUrl: string): Promise<"ok" | "error"> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
