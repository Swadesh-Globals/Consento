import {
  ActivityList,
  AttentionList,
  ChannelBreakdownList,
  ConsentTrend,
  IntegrationHealth,
  LanguageCoverage,
  OverviewMetrics,
  PurposeBreakdownList,
  SetupChecklist,
  TrendRange,
} from "@consent/schemas";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../base";
import * as derive from "../logic/overview";
import { apiError, currentScenario, latency, scenarioError } from "../scenarios";
import { readMockSession, tenantFrom } from "../session";

type Access = "staff" | "configure";
type Guarded = { error: Response } | { slug: string; empty: boolean };

/** Mock guard, deny by default. Tenant comes from request context, never from a query param or body. */
async function guard(request: Request, access: Access): Promise<Guarded> {
  await latency();
  const session = readMockSession();
  if (!session || session.kind !== "staff") return { error: apiError(401, "unauthenticated", "Sign in again") };
  // Mirrors the "workspace.configure" permission in lib/permissions (mocks may not import lib/*).
  if (access === "configure" && session.activeRole !== "admin") {
    return { error: apiError(403, "forbidden", "Your role cannot view this") };
  }
  const failure = scenarioError();
  if (failure) return { error: failure };
  return { slug: tenantFrom(request), empty: currentScenario() === "empty" };
}

const url = (p: string) => `${API_BASE_URL}/overview/${p}`;

export const overviewHandlers = [
  http.get(url("metrics"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    return HttpResponse.json(OverviewMetrics.parse(g.empty ? derive.emptyPayloads.metrics() : derive.metrics(g.slug)));
  }),

  http.get(url("trend"), async ({ request }) => {
    const range = TrendRange.safeParse(new URL(request.url).searchParams.get("range") ?? "30");
    if (!range.success) return apiError(400, "validation_error", "range must be 30 or 90");
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    const body = g.empty ? { range: range.data, points: [] } : derive.trend(g.slug, range.data);
    return HttpResponse.json(ConsentTrend.parse(body));
  }),

  http.get(url("purposes"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    return HttpResponse.json(PurposeBreakdownList.parse({ items: g.empty ? [] : derive.purposes(g.slug) }));
  }),

  http.get(url("channels"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    return HttpResponse.json(ChannelBreakdownList.parse({ items: g.empty ? [] : derive.channels(g.slug) }));
  }),

  http.get(url("attention"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    return HttpResponse.json(AttentionList.parse({ items: g.empty ? [] : derive.attention(g.slug) }));
  }),

  http.get(url("setup"), async ({ request }) => {
    const g = await guard(request, "configure");
    if ("error" in g) return g.error;
    return HttpResponse.json(SetupChecklist.parse(g.empty ? derive.emptyPayloads.setup() : derive.setup(g.slug)));
  }),

  http.get(url("integrations"), async ({ request }) => {
    const g = await guard(request, "configure");
    if ("error" in g) return g.error;
    const body = g.empty ? derive.emptyPayloads.integrations() : derive.integrations(g.slug);
    return HttpResponse.json(IntegrationHealth.parse(body));
  }),

  http.get(url("languages"), async ({ request }) => {
    const g = await guard(request, "configure");
    if ("error" in g) return g.error;
    return HttpResponse.json(LanguageCoverage.parse(g.empty ? { items: [] } : derive.languages(g.slug)));
  }),

  http.get(url("activity"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    return HttpResponse.json(ActivityList.parse({ items: g.empty ? [] : derive.activity(g.slug) }));
  }),
];
