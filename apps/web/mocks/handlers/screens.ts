import {
  ApiKeyList,
  AuditLogList,
  AuditPack,
  AuditPackCreate,
  AuditPackList,
  BannerConfig,
  Breach,
  BreachList,
  Dsr,
  DsrList,
  DsrUpdate,
  Grievance,
  GrievanceList,
  GrievanceUpdate,
  NoticeList,
  Onboarding,
  PrincipalDetail,
  PrincipalList,
  PurposeRowList,
  RetentionRuleList,
  StaffUserList,
  SupportDecision,
  SupportRequestList,
  WebhookDelivery,
  WebhookOverview,
  type StaffRole,
} from "@consent/schemas";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../base";
import { apiError, currentScenario, latency, scenarioError } from "../scenarios";
import { consents, ledger, principals, purposesByTenant } from "../seed";
import * as ops from "../seed/operations";
import * as s from "../seed/screens";
import { readMockSession, tenantFrom } from "../session";

/** Mirrors lib/permissions (mocks may not import lib/*). Deny by default. */
export type Access = "staff" | "compliance" | "lookup" | "dsr" | "grievance" | "breach" | "audit" | "config" | "integrations" | "support";
const allowed: Record<Access, StaffRole[]> = {
  staff: ["admin", "dpo", "operator", "viewer"],
  compliance: ["admin", "dpo"],
  lookup: ["admin", "dpo", "operator"],
  dsr: ["admin", "dpo", "operator"],
  grievance: ["admin", "dpo", "operator"],
  breach: ["admin", "dpo"],
  audit: ["admin", "dpo"],
  config: ["admin"],
  integrations: ["admin"],
  support: ["admin", "dpo"],
};

type Guarded = { error: Response } | { slug: string; empty: boolean; actor: string };

export async function guard(request: Request, access: Access): Promise<Guarded> {
  await latency();
  const session = readMockSession();
  if (!session) return { error: apiError(401, "unauthenticated", "Sign in again") };
  if (!allowed[access].includes(session.activeRole)) return { error: apiError(403, "forbidden", "Your role cannot do this") };
  const failure = scenarioError();
  if (failure) return { error: failure };
  return { slug: tenantFrom(request), empty: currentScenario() === "empty", actor: session.displayName };
}

const url = (p: string) => `${API_BASE_URL}${p}`;
const notFound = () => apiError(404, "not_found", "Not found");
/** Strip the internal tenantSlug before validating against the public schema. */
export function strip<T extends { tenantSlug: string }>(row: T): Omit<T, "tenantSlug"> {
  const { tenantSlug: _t, ...rest } = row;
  return rest;
}
export const mine = <T extends { tenantSlug: string }>(rows: T[], slug: string, empty: boolean) =>
  empty ? [] : rows.filter((r) => r.tenantSlug === slug).map(strip);

async function body(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

function principalSummary(id: string) {
  const own = consents.filter((c) => c.principalId === id);
  const p = principals.find((x) => x.id === id);
  return {
    id,
    maskedContact: s.mask(p?.contact ?? "0000000000"),
    activeConsents: own.filter((c) => c.status === "granted").length,
    withdrawnConsents: own.filter((c) => c.status === "withdrawn").length,
    lastActivityAt: own.map((c) => c.updatedAt).sort().at(-1) ?? new Date().toISOString(),
  };
}

export const screenHandlers = [
  // DPO-02 consent lookup
  http.get(url("/principals"), async ({ request }) => {
    const g = await guard(request, "lookup");
    if ("error" in g) return g.error;
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
    const pool = g.empty ? [] : principals.filter((p) => p.tenantSlug === g.slug);
    const hits = q ? pool.filter((p) => p.id.includes(q) || p.contact.toLowerCase().includes(q)) : pool;
    return HttpResponse.json(PrincipalList.parse({ items: hits.slice(0, 25).map((p) => principalSummary(p.id)), total: hits.length }));
  }),
  http.get(url("/principals/:id"), async ({ request, params }) => {
    const g = await guard(request, "lookup");
    if ("error" in g) return g.error;
    const p = principals.find((x) => x.id === params.id && x.tenantSlug === g.slug); // IDOR: tenant-scoped lookup
    if (!p) return notFound();
    return HttpResponse.json(
      PrincipalDetail.parse({
        principal: principalSummary(p.id),
        consents: consents.filter((c) => c.principalId === p.id),
        ledger: ledger.filter((l) => l.principalId === p.id).map(({ principalId: _p, tenantSlug: _t, ...l }) => l),
        chainVerified: true,
      }),
    );
  }),

  // DPO-03/04 rights requests
  http.get(url("/dsr"), async ({ request }) => {
    const g = await guard(request, "dsr");
    if ("error" in g) return g.error;
    return HttpResponse.json(DsrList.parse({ items: mine(s.dsrRows, g.slug, g.empty) }));
  }),
  http.patch(url("/dsr/:id"), async ({ request, params }) => {
    const g = await guard(request, "dsr");
    if ("error" in g) return g.error;
    const input = DsrUpdate.safeParse(await body(request));
    if (!input.success) return apiError(400, "validation_error", "Invalid status");
    const row = s.dsrRows.find((d) => d.id === params.id && d.tenantSlug === g.slug);
    if (!row) return notFound();
    row.status = input.data.status;
    row.assignee ??= g.actor;
    if (input.data.status !== "submitted") row.identityVerified = true;
    row.timeline.push({ at: new Date().toISOString(), actor: g.actor, note: `Status changed to ${input.data.status.replace("_", " ")}` });
    const base = ops.dsrs.find((d) => d.id === row.id);
    if (base) base.status = row.status;
    s.logAudit(g.slug, g.actor, "updated rights request", row.id);
    return HttpResponse.json(Dsr.parse(strip(row)));
  }),

  // DPO-05 grievances
  http.get(url("/grievances"), async ({ request }) => {
    const g = await guard(request, "grievance");
    if ("error" in g) return g.error;
    return HttpResponse.json(GrievanceList.parse({ items: mine(s.grievanceRows, g.slug, g.empty) }));
  }),
  http.patch(url("/grievances/:id"), async ({ request, params }) => {
    const g = await guard(request, "grievance");
    if ("error" in g) return g.error;
    const input = GrievanceUpdate.safeParse(await body(request));
    if (!input.success) return apiError(400, "validation_error", "Invalid status");
    const row = s.grievanceRows.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!row) return notFound();
    row.status = input.data.status;
    row.assignee ??= g.actor;
    if (input.data.status === "resolved") {
      row.closureNote = input.data.closureNote?.trim() || "Resolved by DPO.";
      row.evidence = ["Response letter (PDF)", "Ledger extract for principal"];
    }
    const base = ops.grievances.find((x) => x.id === row.id);
    if (base) base.status = row.status;
    s.logAudit(g.slug, g.actor, `${input.data.status} grievance`, row.id);
    return HttpResponse.json(Grievance.parse(strip(row)));
  }),

  // DPO-06 breaches
  http.get(url("/breaches"), async ({ request }) => {
    const g = await guard(request, "breach");
    if ("error" in g) return g.error;
    return HttpResponse.json(BreachList.parse({ items: mine(s.breachRows, g.slug, g.empty) }));
  }),
  http.post(url("/breaches/:id/notify"), async ({ request, params }) => {
    const g = await guard(request, "breach");
    if ("error" in g) return g.error;
    const row = s.breachRows.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!row) return notFound();
    const at = new Date().toISOString();
    row.status = "notified";
    row.boardNotifiedAt ??= at;
    row.principalsNotifiedAt ??= at;
    row.timeline.push({ at, actor: g.actor, note: "Board intimation and principal notices sent" });
    const base = ops.breaches.find((x) => x.id === row.id);
    if (base) base.status = "notified";
    s.logAudit(g.slug, g.actor, "notified Board and principals", row.title);
    return HttpResponse.json(Breach.parse(strip(row)));
  }),

  // DPO-07 audit packs
  http.get(url("/audit-packs"), async ({ request }) => {
    const g = await guard(request, "audit");
    if ("error" in g) return g.error;
    return HttpResponse.json(AuditPackList.parse({ items: mine(s.auditPackRows, g.slug, g.empty) }));
  }),
  http.post(url("/audit-packs"), async ({ request }) => {
    const g = await guard(request, "audit");
    if ("error" in g) return g.error;
    const input = AuditPackCreate.safeParse(await body(request));
    if (!input.success) return apiError(400, "validation_error", "Choose a period");
    const row = {
      id: `pack_${crypto.randomUUID().slice(0, 12)}`,
      tenantSlug: g.slug,
      period: input.data.period,
      requestedBy: g.actor,
      createdAt: new Date().toISOString(),
      status: "ready" as const,
      sizeKb: 2400 + Math.floor(Math.random() * 4000),
      sections: s.packSections,
    };
    s.auditPackRows.unshift(row);
    s.logAudit(g.slug, g.actor, "exported audit pack", row.period);
    return HttpResponse.json(AuditPack.parse(strip(row)), { status: 201 });
  }),

  // Onboarding
  http.get(url("/onboarding"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const setup = ops.tenantSetup.find((t) => t.tenantSlug === g.slug);
    const org = s.onboardingOrg.get(g.slug);
    if (!setup || !org) return notFound();
    const published = s.noticeRows.some((n) => n.tenantSlug === g.slug && n.status === "published");
    const sdk = ops.sdkDomains.some((d) => d.tenantSlug === g.slug && d.lastSeenAt);
    return HttpResponse.json(
      Onboarding.parse({
        organisation: org,
        steps: [
          { key: "organisation", done: true, link: "/onboarding" },
          { key: "dpoContact", done: setup.dpoContactSet, link: "/onboarding" },
          { key: "purposes", done: (purposesByTenant.get(g.slug)?.length ?? 0) > 0, link: "/purposes" },
          { key: "notice", done: published, link: "/notices" },
          { key: "banner", done: setup.bannerLive, link: "/banner" },
          { key: "sdk", done: sdk, link: "/api-keys" },
          { key: "webhooks", done: setup.webhookEndpoints > 0, link: "/webhooks" },
          { key: "retention", done: setup.retentionRules > 0, link: "/retention" },
        ],
      }),
    );
  }),

  // CFG-01 purposes
  http.get(url("/purposes"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const items = g.empty
      ? []
      : (purposesByTenant.get(g.slug) ?? []).map((p, i) => ({ ...p, activeConsents: s.activeConsentsFor(g.slug, p.id), status: i === 11 && g.slug === "hello-llp" ? "draft" : "active" }));
    return HttpResponse.json(PurposeRowList.parse({ items }));
  }),

  // CFG-02 notices
  http.get(url("/notices"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    return HttpResponse.json(NoticeList.parse({ items: mine(s.noticeRows, g.slug, g.empty) }));
  }),
  http.post(url("/notices/:id/publish"), async ({ request, params }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const row = s.noticeRows.find((n) => n.id === params.id && n.tenantSlug === g.slug);
    if (!row) return notFound();
    const next = `v${row.versions.length + 1}.0`;
    row.versions.push({ version: next, publishedAt: new Date().toISOString(), hash: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("") });
    row.version = next;
    row.status = "published";
    row.updatedAt = new Date().toISOString();
    const base = ops.notices.find((n) => n.id === row.id);
    if (base) base.status = "published";
    s.logAudit(g.slug, g.actor, "published notice", `${row.title} ${next}`);
    return HttpResponse.json(NoticeList.parse({ items: [strip(row)] }));
  }),

  // CFG-03 banner
  http.get(url("/banner"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const b = s.bannerByTenant.get(g.slug);
    return b ? HttpResponse.json(BannerConfig.parse(b)) : notFound();
  }),
  http.put(url("/banner"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const input = BannerConfig.safeParse(await body(request));
    if (!input.success) return apiError(400, "validation_error", "Check the banner fields");
    s.bannerByTenant.set(g.slug, input.data);
    s.logAudit(g.slug, g.actor, "changed banner", input.data.layout);
    return HttpResponse.json(input.data);
  }),

  // CFG-09 retention
  http.get(url("/retention"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    return HttpResponse.json(RetentionRuleList.parse({ items: mine(s.retentionRows, g.slug, g.empty) }));
  }),

  // CFG-04/07 users
  http.get(url("/users"), async ({ request }) => {
    const g = await guard(request, "integrations");
    if ("error" in g) return g.error;
    return HttpResponse.json(StaffUserList.parse({ items: mine(s.userRows, g.slug, g.empty) }));
  }),

  // CFG-05 API keys
  http.get(url("/api-keys"), async ({ request }) => {
    const g = await guard(request, "integrations");
    if ("error" in g) return g.error;
    return HttpResponse.json(ApiKeyList.parse({ items: mine(s.apiKeyRows, g.slug, g.empty) }));
  }),

  // CFG-06 webhooks
  http.get(url("/webhooks"), async ({ request }) => {
    const g = await guard(request, "integrations");
    if ("error" in g) return g.error;
    return HttpResponse.json(
      WebhookOverview.parse({
        endpoints: mine(s.webhookEndpoints, g.slug, g.empty),
        deliveries: mine(s.webhookDeliveryRows, g.slug, g.empty).slice(0, 60),
      }),
    );
  }),
  http.post(url("/webhooks/deliveries/:id/replay"), async ({ request, params }) => {
    const g = await guard(request, "integrations");
    if ("error" in g) return g.error;
    const row = s.webhookDeliveryRows.find((d) => d.id === params.id && d.tenantSlug === g.slug);
    if (!row) return notFound();
    row.ok = true;
    row.httpStatus = 200;
    row.attempts += 1;
    row.at = new Date().toISOString();
    s.logAudit(g.slug, g.actor, "replayed webhook delivery", row.event);
    return HttpResponse.json(WebhookDelivery.parse(strip(row)));
  }),

  // CFG-14 support access
  http.get(url("/support-access"), async ({ request }) => {
    const g = await guard(request, "support");
    if ("error" in g) return g.error;
    return HttpResponse.json(SupportRequestList.parse({ items: mine(s.supportRows, g.slug, g.empty) }));
  }),
  http.post(url("/support-access/:id/decision"), async ({ request, params }) => {
    const g = await guard(request, "support");
    if ("error" in g) return g.error;
    const input = SupportDecision.safeParse(await body(request));
    if (!input.success) return apiError(400, "validation_error", "Invalid decision");
    const row = s.supportRows.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!row) return notFound();
    if (row.status !== "pending") return apiError(409, "conflict", "Already decided");
    row.status = input.data.decision;
    row.expiresAt = input.data.decision === "approved" ? new Date(Date.now() + row.durationHours * 3_600_000).toISOString() : null;
    const base = ops.supportRequests.find((x) => x.id === row.id);
    if (base) base.status = row.status;
    s.logAudit(g.slug, g.actor, `${input.data.decision} support access`, row.reason);
    return HttpResponse.json(SupportRequestList.parse({ items: [strip(row)] }));
  }),

  // CFG-15 audit log
  http.get(url("/audit-log"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    return HttpResponse.json(AuditLogList.parse({ items: mine(s.auditLogRows, g.slug, g.empty).slice(0, 100) }));
  }),
];
