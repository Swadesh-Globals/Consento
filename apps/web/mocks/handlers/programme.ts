import {
  AssessmentList,
  Branding,
  CollectionChannelList,
  DashboardExtras,
  ErasureList,
  GuardianConsentList,
  GuardianDecision,
  InteropOverview,
  InventoryList,
  LanguageContent,
  LanguagePackList,
  LedgerVerification,
  LegitimateUseList,
  LogRetention,
  NoticeDiff,
  NotificationList,
  PrivacyPolicyUpdate,
  ProcessorList,
  ReportList,
  ResponseTemplateList,
  Sandbox,
  SsoConfig,
  Usage,
  VerificationSettingList,
  WithdrawalPropagationList,
  WorkflowRuleList,
} from "@consent/schemas";
import { http, HttpResponse } from "msw";
import type { z } from "zod";
import { API_BASE_URL } from "../base";
import { apiError } from "../scenarios";
import { consents, ledger, principals } from "../seed";
import * as ops from "../seed/operations";
import { contentKey, languageContent, languagePacks } from "../seed/languages";
import * as p from "../seed/programme";
import * as s from "../seed/screens";
import { guard, mine, type Access } from "./screens";

const url = (path: string) => `${API_BASE_URL}${path}`;
const notFound = () => apiError(404, "not_found", "Not found");

/** GET list endpoint: guard → tenant-scoped rows → schema-validated { items }. */
function list<S extends z.ZodObject>(path: string, access: Access, schema: S, rows: Array<{ tenantSlug: string }>) {
  return http.get(url(path), async ({ request }) => {
    const g = await guard(request, access);
    if ("error" in g) return g.error;
    return HttpResponse.json(schema.parse({ items: mine(rows, g.slug, g.empty) }));
  });
}

/** GET single per-tenant config object. */
function single<S extends z.ZodObject>(path: string, access: Access, schema: S, store: Map<string, unknown>) {
  return http.get(url(path), async ({ request }) => {
    const g = await guard(request, access);
    if ("error" in g) return g.error;
    const v = store.get(g.slug);
    return v ? HttpResponse.json(schema.parse(v)) : notFound();
  });
}

export const programmeHandlers = [
  // DPO-01 extras: SLA buckets, notice version coverage, propagation backlog
  http.get(url("/overview/extras"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    const open = ops.dsrs.filter((d) => d.tenantSlug === g.slug && (d.status === "submitted" || d.status === "in_progress"));
    const left = (d: { dueAt: string }) => Date.parse(d.dueAt) - Date.now();
    const ids = new Set(principals.filter((x) => x.tenantSlug === g.slug).map((x) => x.id));
    const byVersion = new Map<string, number>();
    for (const c of consents) if (ids.has(c.principalId) && c.status === "granted") byVersion.set(c.noticeVersion, (byVersion.get(c.noticeVersion) ?? 0) + 1);
    return HttpResponse.json(
      DashboardExtras.parse(
        g.empty
          ? { sla: { onTrack: 0, dueSoon: 0, overdue: 0 }, noticeCoverage: [], propagationPending: 0 }
          : {
              sla: {
                onTrack: open.filter((d) => left(d) > 2 * 86_400_000).length,
                dueSoon: open.filter((d) => left(d) > 0 && left(d) <= 2 * 86_400_000).length,
                overdue: open.filter((d) => left(d) <= 0).length,
              },
              noticeCoverage: [...byVersion.entries()].sort().map(([version, n]) => ({ version, consents: n })),
              propagationPending: p.withdrawals.filter((w) => w.tenantSlug === g.slug && w.targets.some((t) => t.status !== "confirmed")).length,
            },
      ),
    );
  }),

  http.get(url("/dsr/templates"), async ({ request }) => {
    const g = await guard(request, "dsr");
    if ("error" in g) return g.error;
    return HttpResponse.json(ResponseTemplateList.parse({ items: p.templates }));
  }),

  // DPO-11 withdrawal propagation
  list("/withdrawals", "lookup", WithdrawalPropagationList, p.withdrawals),
  http.post(url("/withdrawals/:id/retry"), async ({ request, params }) => {
    const g = await guard(request, "lookup");
    if ("error" in g) return g.error;
    const row = p.withdrawals.find((w) => w.id === params.id && w.tenantSlug === g.slug);
    if (!row) return notFound();
    const at = new Date().toISOString();
    for (const t of row.targets) if (t.status !== "confirmed") Object.assign(t, { status: "confirmed", ackAt: at });
    s.logAudit(g.slug, g.actor, "re-sent withdrawal to downstream systems", row.purposeName);
    return HttpResponse.json(WithdrawalPropagationList.parse({ items: [{ ...row, tenantSlug: undefined }] }));
  }),

  // DPO-12 guardian consent
  list("/guardian-consents", "dsr", GuardianConsentList, p.guardianConsents),
  http.post(url("/guardian-consents/:id/decision"), async ({ request, params }) => {
    const g = await guard(request, "dsr");
    if ("error" in g) return g.error;
    const input = GuardianDecision.safeParse(await request.json().catch(() => null));
    if (!input.success) return apiError(400, "validation_error", "Invalid decision");
    const row = p.guardianConsents.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!row) return notFound();
    row.status = input.data.status;
    s.logAudit(g.slug, g.actor, `${input.data.status} guardian consent`, `${row.method.replaceAll("_", " ")} · ${row.purposeName}`);
    return HttpResponse.json(GuardianConsentList.parse({ items: [{ ...row, tenantSlug: undefined }] }));
  }),

  // DPO-13 erasure scheduler
  list("/erasures", "compliance", ErasureList, p.erasures),
  http.post(url("/erasures/:id/hold"), async ({ request, params }) => {
    const g = await guard(request, "compliance");
    if ("error" in g) return g.error;
    const row = p.erasures.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!row) return notFound();
    row.status = row.status === "held" ? "notice_pending" : "held";
    s.logAudit(g.slug, g.actor, row.status === "held" ? "placed erasure on hold" : "released erasure hold", row.purposeName);
    return HttpResponse.json(ErasureList.parse({ items: [{ ...row, tenantSlug: undefined }] }));
  }),

  // CFG-08, DPO-15, DPO-09
  list("/legitimate-uses", "compliance", LegitimateUseList, p.legitimateUses),
  list("/reports", "audit", ReportList, p.reports),
  list("/assessments", "compliance", AssessmentList, p.assessments),
  http.get(url("/ledger/verify"), async ({ request }) => {
    const g = await guard(request, "audit");
    if ("error" in g) return g.error;
    const own = ledger.filter((l) => l.tenantSlug === g.slug);
    const head = own.at(-1);
    return HttpResponse.json(
      LedgerVerification.parse({
        verified: true,
        entries: own.length,
        headHash: head?.entryHash ?? "0".repeat(64),
        lastAnchorAt: new Date(Date.now() - 9 * 3_600_000).toISOString(),
        anchorObject: `s3://ledger-anchors/${g.slug}/2026-11-22.json (Object Lock)`,
        checkedAt: new Date().toISOString(),
      }),
    );
  }),

  // Configuration
  list("/processors", "config", ProcessorList, p.processors),
  list("/inventory", "config", InventoryList, p.inventory),
  list("/language-packs", "config", LanguagePackList, languagePacks),
  // CFG-11 per-language principal-facing content (banner, notice, privacy policy)
  http.get(url("/language-packs/:code"), async ({ request, params }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    const c = languageContent.get(contentKey(g.slug, String(params.code)));
    return c ? HttpResponse.json(LanguageContent.parse(c)) : notFound();
  }),
  http.put(url("/language-packs/:code/privacy-policy"), async ({ request, params }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const input = PrivacyPolicyUpdate.safeParse(await request.json().catch(() => null));
    if (!input.success) return apiError(400, "validation_error", "Invalid privacy policy");
    const c = languageContent.get(contentKey(g.slug, String(params.code)));
    const pack = languagePacks.find((x) => x.tenantSlug === g.slug && x.code === params.code);
    if (!c || !pack) return notFound();
    c.privacyPolicy = input.data.privacyPolicy;
    c.updatedAt = new Date().toISOString();
    pack.privacyPolicy = "in_review";
    s.logAudit(g.slug, g.actor, "updated privacy policy", pack.name);
    return HttpResponse.json(LanguageContent.parse(c));
  }),
  list("/channels", "config", CollectionChannelList, p.channels),
  list("/verification-settings", "config", VerificationSettingList, p.verification),
  list("/workflow-rules", "config", WorkflowRuleList, p.workflows),
  single("/branding", "config", Branding, p.branding),
  single("/sso", "integrations", SsoConfig, p.sso),
  single("/log-retention", "config", LogRetention, p.logRetention),
  http.get(url("/interop"), async ({ request }) => {
    const g = await guard(request, "integrations");
    if ("error" in g) return g.error;
    return HttpResponse.json(InteropOverview.parse(p.interop));
  }),
  http.get(url("/notices/:id/diff"), async ({ request, params }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const n = s.noticeRows.find((x) => x.id === params.id && x.tenantSlug === g.slug);
    if (!n) return notFound();
    const to = n.versions.at(-1)?.version ?? n.version;
    const from = n.versions.at(-2)?.version ?? "—";
    const targeted = 40 + n.title.length * 7;
    return HttpResponse.json(
      NoticeDiff.parse({
        from,
        to,
        lines: [
          { op: "same", text: `We use your data for: ${n.title.replace(" notice", "")}.` },
          { op: "remove", text: "We keep this data for 3 years." },
          { op: "add", text: "We keep this data for 2 years, then erase it." },
          { op: "add", text: "We share it with our analytics provider." },
          { op: "same", text: "You can withdraw consent at any time from the privacy link." },
          { op: "same", text: "You can complain to our DPO or to the Data Protection Board of India." },
        ],
        reconsent: { targeted, reconsented: Math.floor(targeted * 0.62), pending: targeted - Math.floor(targeted * 0.62), campaignStatus: n.status === "published" ? "running" : "not_started" },
      }),
    );
  }),

  // Platform
  list("/notifications", "staff", NotificationList, p.notifications),
  http.post(url("/notifications/read-all"), async ({ request }) => {
    const g = await guard(request, "staff");
    if ("error" in g) return g.error;
    for (const n of p.notifications) if (n.tenantSlug === g.slug) n.read = true;
    return HttpResponse.json(NotificationList.parse({ items: mine(p.notifications, g.slug, false) }));
  }),
  single("/sandbox", "config", Sandbox, p.sandboxes),
  http.post(url("/sandbox/reset"), async ({ request }) => {
    const g = await guard(request, "config");
    if ("error" in g) return g.error;
    const sb = p.sandboxes.get(g.slug);
    if (!sb) return notFound();
    sb.lastResetAt = new Date().toISOString();
    s.logAudit(g.slug, g.actor, "reset sandbox", sb.slug);
    return HttpResponse.json(Sandbox.parse(sb));
  }),
  single("/usage", "config", Usage, p.usage),
];
