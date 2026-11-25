import { delay, HttpResponse } from "msw";

export type Scenario = "normal" | "empty" | "heavy" | "error" | "slow";

/** ?scenario=empty|normal|heavy|error|slow on the page URL (frontend.md §8). */
export function currentScenario(): Scenario {
  if (typeof window === "undefined") return "normal";
  const s = new URLSearchParams(window.location.search).get("scenario");
  return s === "empty" || s === "heavy" || s === "error" || s === "slow" ? s : "normal";
}

export async function latency(): Promise<void> {
  const s = currentScenario();
  await delay(s === "slow" ? 3000 : 150 + Math.floor(Math.random() * 450));
}

let counter = 0;
export function requestId(): string {
  counter += 1;
  return `mock-${Date.now().toString(36)}-${counter}`;
}

export function apiError(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
  const rid = requestId();
  return HttpResponse.json(
    { code, message, requestId: rid, ...(fieldErrors ? { fieldErrors } : {}) },
    { status, headers: { "x-request-id": rid } },
  );
}

export function scenarioError() {
  return currentScenario() === "error" ? apiError(503, "service_unavailable", "Simulated outage") : null;
}
