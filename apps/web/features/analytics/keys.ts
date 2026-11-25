import type { TrendRange } from "@consent/schemas";

/** Tenant-scoped so cached Overview data never leaks across tenants (frontend.md §5). */
export const overviewKeys = {
  all: (t: string) => ["tenant", t, "overview"] as const,
  metrics: (t: string) => [...overviewKeys.all(t), "metrics"] as const,
  trend: (t: string, range: TrendRange) => [...overviewKeys.all(t), "trend", range] as const,
  purposes: (t: string) => [...overviewKeys.all(t), "purposes"] as const,
  channels: (t: string) => [...overviewKeys.all(t), "channels"] as const,
  attention: (t: string) => [...overviewKeys.all(t), "attention"] as const,
  setup: (t: string) => [...overviewKeys.all(t), "setup"] as const,
  integrations: (t: string) => [...overviewKeys.all(t), "integrations"] as const,
  languages: (t: string) => [...overviewKeys.all(t), "languages"] as const,
  activity: (t: string) => [...overviewKeys.all(t), "activity"] as const,
};
