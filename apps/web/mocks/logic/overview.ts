import type {
  ActivityEvent,
  AttentionItem,
  ChannelBreakdown,
  ConsentTrend,
  IntegrationHealth,
  LanguageCoverage,
  OverviewMetrics,
  PurposeBreakdown,
  SetupChecklist,
  TrendRange,
} from "@consent/schemas";
import { consents, day, ledger, now, principals, purposesByTenant } from "../seed";
import {
  apiKeys,
  auditEvents,
  breaches,
  dsrs,
  grievances,
  notices,
  preErasureNotices,
  sdkDomains,
  supportRequests,
  tenantSetup,
  webhookDeliveries,
} from "../seed/operations";

/** Pure derivations from the seeded store, so Overview numbers match every other screen. */

const hour = 3_600_000;
const IST_OFFSET = 5.5 * hour;
const ms = (iso: string) => new Date(iso).getTime();
const toIso = (t: number) => new Date(t).toISOString();
const istDate = (t: number) => new Date(t + IST_OFFSET).toISOString().slice(0, 10);
const round1 = (n: number) => Math.round(n * 10) / 10;
const pctChange = (cur: number, prev: number) => (prev === 0 ? null : round1(((cur - prev) / prev) * 100));

const GRIEVANCE_CAP_DAYS = 90;
const NEAR_CAP_DAYS = 75;
const BREACH_DEADLINE_HOURS = 72;

const isOpenDsr = (s: string) => s === "submitted" || s === "in_progress";
const isOpenGrievance = (s: string) => s === "open" || s === "escalated";

function tenantConsents(slug: string) {
  const ids = new Set(principals.filter((p) => p.tenantSlug === slug).map((p) => p.id));
  return consents.filter((c) => ids.has(c.principalId));
}

function activeAt(slug: string, t: number): number {
  return tenantConsents(slug).filter((c) => {
    if (!c.grantedAt || ms(c.grantedAt) > t) return false;
    if (c.status === "granted") return true;
    return (c.status === "withdrawn" || c.status === "expired") && ms(c.updatedAt) > t;
  }).length;
}

function earliest(isos: string[]): string | null {
  return [...isos].sort((a, b) => ms(a) - ms(b))[0] ?? null;
}

export function metrics(slug: string): OverviewMetrics {
  const events = ledger.filter((e) => e.tenantSlug === slug);
  const withdrawnIn = (from: number, to: number) =>
    events.filter((e) => e.event === "withdrawn" && ms(e.at) > from && ms(e.at) <= to).length;
  const w7 = withdrawnIn(now - 7 * day, now);
  const granted = events.filter((e) => e.event === "granted").length;
  const requested = events.filter((e) => e.event === "requested").length;
  const active = activeAt(slug, now);

  const openDsr = dsrs.filter((d) => d.tenantSlug === slug && isOpenDsr(d.status));
  const openGrv = grievances.filter((g) => g.tenantSlug === slug && isOpenGrievance(g.status));
  const openBreaches = breaches.filter((b) => b.tenantSlug === slug && b.status === "open");
  const oldest = earliest(openBreaches.map((b) => b.detectedAt));

  return {
    activeConsents: { value: active, changePct30d: pctChange(active, activeAt(slug, now - 30 * day)) },
    withdrawals7d: { value: w7, trendPct: pctChange(w7, withdrawnIn(now - 14 * day, now - 7 * day)) },
    optInRate: { value: requested === 0 ? null : round1((granted / requested) * 100), granted, requested },
    openRightsRequests: {
      value: openDsr.length,
      dueWithin48h: openDsr.filter((d) => ms(d.dueAt) - now <= 48 * hour).length,
    },
    openGrievances: {
      value: openGrv.length,
      nearCap: openGrv.filter((g) => now - ms(g.openedAt) >= NEAR_CAP_DAYS * day).length,
    },
    activeBreaches: {
      value: openBreaches.length,
      oldestDeadlineAt: oldest === null ? null : toIso(ms(oldest) + BREACH_DEADLINE_HOURS * hour),
    },
  };
}

export function trend(slug: string, range: TrendRange): ConsentTrend {
  const days = Number(range);
  const buckets = new Map<string, { granted: number; withdrawn: number }>();
  for (let i = days - 1; i >= 0; i -= 1) buckets.set(istDate(now - i * day), { granted: 0, withdrawn: 0 });
  for (const e of ledger) {
    if (e.tenantSlug !== slug || (e.event !== "granted" && e.event !== "withdrawn")) continue;
    const bucket = buckets.get(istDate(ms(e.at)));
    if (bucket) bucket[e.event] += 1;
  }
  return { range, points: [...buckets].map(([date, v]) => ({ date, ...v })) };
}

export function purposes(slug: string): PurposeBreakdown[] {
  const list = tenantConsents(slug);
  return (purposesByTenant.get(slug) ?? []).map((p) => {
    const mine = list.filter((c) => c.purpose.id === p.id);
    const granted = mine.filter((c) => c.status === "granted").length;
    const withdrawn = mine.filter((c) => c.status === "withdrawn").length;
    const base = granted + withdrawn;
    return {
      purposeId: p.id,
      purposeName: p.name,
      granted,
      withdrawn,
      withdrawalRate: base === 0 ? 0 : round1((withdrawn / base) * 100),
    };
  });
}

export function channels(slug: string): ChannelBreakdown[] {
  const list = tenantConsents(slug).filter((c) => c.status === "granted");
  return (["web", "mobile", "api", "hosted_page"] as const).map((channel) => ({
    channel,
    count: list.filter((c) => c.channel === channel).length,
  }));
}

/** Unsorted. The client sorts by urgency and filters by permission; the P1 backend also filters by role. */
export function attention(slug: string): AttentionItem[] {
  const items: AttentionItem[] = [];
  const push = (item: AttentionItem) => {
    if (item.count > 0) items.push(item);
  };

  const dsrDue = dsrs.filter((d) => d.tenantSlug === slug && isOpenDsr(d.status) && ms(d.dueAt) - now <= 48 * hour);
  push({
    id: `att_dsr_${slug}`,
    type: "dsr_sla",
    severity: dsrDue.some((d) => ms(d.dueAt) < now) ? "critical" : "high",
    dueAt: earliest(dsrDue.map((d) => d.dueAt)),
    link: "/dsr",
    count: dsrDue.length,
  });

  const grvNear = grievances.filter(
    (g) => g.tenantSlug === slug && isOpenGrievance(g.status) && now - ms(g.openedAt) >= NEAR_CAP_DAYS * day,
  );
  push({
    id: `att_grv_${slug}`,
    type: "grievance_cap",
    severity: "high",
    dueAt: earliest(grvNear.map((g) => toIso(ms(g.openedAt) + GRIEVANCE_CAP_DAYS * day))),
    link: "/grievances-queue",
    count: grvNear.length,
  });

  for (const b of breaches.filter((x) => x.tenantSlug === slug && x.status === "open")) {
    push({
      id: `att_${b.id}`,
      type: "breach_deadline",
      severity: "critical",
      dueAt: toIso(ms(b.detectedAt) + BREACH_DEADLINE_HOURS * hour),
      link: "/breaches",
      count: 1,
    });
  }

  push({
    id: `att_whk_${slug}`,
    type: "webhook_failure",
    severity: "medium",
    dueAt: null,
    link: "/webhooks",
    count: webhookDeliveries.filter((d) => d.tenantSlug === slug && !d.ok && now - ms(d.at) <= 7 * day).length,
  });

  push({
    id: `att_ntc_${slug}`,
    type: "notice_approval",
    severity: "low",
    dueAt: null,
    link: "/notices",
    count: notices.filter((n) => n.tenantSlug === slug && n.status === "pending_approval").length,
  });

  const pendingSupport = supportRequests.filter((s) => s.tenantSlug === slug && s.status === "pending");
  push({
    id: `att_sup_${slug}`,
    type: "support_access",
    severity: "high",
    dueAt: earliest(pendingSupport.map((s) => toIso(ms(s.requestedAt) + 48 * hour))),
    link: "/support-access",
    count: pendingSupport.length,
  });

  const preDue = preErasureNotices.filter((p) => p.tenantSlug === slug && ms(p.dueAt) - now <= 7 * day);
  push({
    id: `att_pre_${slug}`,
    type: "pre_erasure",
    severity: "medium",
    dueAt: earliest(preDue.map((p) => p.dueAt)),
    link: "/retention",
    count: preDue.length,
  });

  const expiring = tenantConsents(slug).filter(
    (c) => c.status === "granted" && c.validUntil !== null && ms(c.validUntil) > now && ms(c.validUntil) - now <= 30 * day,
  );
  push({
    id: `att_exp_${slug}`,
    type: "consent_expiry",
    severity: "low",
    dueAt: earliest(expiring.flatMap((c) => (c.validUntil ? [c.validUntil] : []))),
    link: "/principals",
    count: expiring.length,
  });

  return items;
}

export function setup(slug: string): SetupChecklist {
  const s = tenantSetup.find((x) => x.tenantSlug === slug);
  const items: SetupChecklist["items"] = [
    { key: "purposes", done: (purposesByTenant.get(slug) ?? []).length > 0, link: "/purposes" },
    { key: "notice", done: notices.some((n) => n.tenantSlug === slug && n.status === "published"), link: "/notices" },
    { key: "banner", done: s?.bannerLive ?? false, link: "/banner" },
    { key: "sdk", done: sdkDomains.some((d) => d.tenantSlug === slug && d.lastSeenAt !== null), link: "/onboarding" },
    { key: "webhooks", done: (s?.webhookEndpoints ?? 0) > 0, link: "/webhooks" },
    { key: "dpoContact", done: s?.dpoContactSet ?? false, link: "/onboarding" },
    { key: "retention", done: (s?.retentionRules ?? 0) > 0, link: "/retention" },
  ];
  return { score: Math.round((items.filter((i) => i.done).length / items.length) * 100), items };
}

export function integrations(slug: string): IntegrationHealth {
  const recent = webhookDeliveries.filter((d) => d.tenantSlug === slug && now - ms(d.at) <= 7 * day);
  return {
    sdk: sdkDomains.filter((d) => d.tenantSlug === slug).map(({ domain, lastSeenAt }) => ({ domain, lastSeenAt })),
    webhooks: {
      deliveries7d: recent.length,
      successRate7d: recent.length === 0 ? null : round1((recent.filter((d) => d.ok).length / recent.length) * 100),
    },
    apiKeys: apiKeys.filter((k) => k.tenantSlug === slug).map(({ id, name, lastUsedAt }) => ({ id, name, lastUsedAt })),
  };
}

export function languages(slug: string): LanguageCoverage {
  const mine = notices.filter((n) => n.tenantSlug === slug);
  const pct = (k: "hi" | "kn") =>
    mine.length === 0 ? 0 : Math.round((mine.filter((n) => n.translated[k]).length / mine.length) * 100);
  if (mine.length === 0) return { items: [] };
  return {
    items: [
      { locale: "en", label: "English", translatedPct: 100 },
      { locale: "hi", label: "हिन्दी", translatedPct: pct("hi") },
      { locale: "kn", label: "ಕನ್ನಡ", translatedPct: pct("kn") },
    ],
  };
}

export function activity(slug: string): ActivityEvent[] {
  return auditEvents
    .filter((e) => e.tenantSlug === slug)
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, 10)
    .map(({ id, at, actorName, action, target }) => ({ id, at, actorName, action, target }));
}

/** ?scenario=empty payloads: same shapes, nothing in them. */
export const emptyPayloads = {
  metrics: (): OverviewMetrics => ({
    activeConsents: { value: 0, changePct30d: null },
    withdrawals7d: { value: 0, trendPct: null },
    optInRate: { value: null, granted: 0, requested: 0 },
    openRightsRequests: { value: 0, dueWithin48h: 0 },
    openGrievances: { value: 0, nearCap: 0 },
    activeBreaches: { value: 0, oldestDeadlineAt: null },
  }),
  setup: (): SetupChecklist => ({ score: 0, items: setup("globals-inc").items.map((i) => ({ ...i, done: false })) }),
  integrations: (): IntegrationHealth => ({ sdk: [], webhooks: { deliveries7d: 0, successRate7d: null }, apiKeys: [] }),
};
