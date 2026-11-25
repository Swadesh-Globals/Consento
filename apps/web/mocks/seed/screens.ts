import { Faker, en } from "@faker-js/faker";
import type {
  ApiKey,
  AuditLogEvent,
  AuditPack,
  BannerConfig,
  Breach,
  Dsr,
  Grievance,
  Notice,
  RetentionRule,
  StaffUser,
  SupportRequest,
  WebhookDelivery,
  WebhookEndpoint,
} from "@consent/schemas";
import { consents, day, now, principals, purposesByTenant, tenants } from "./index";
import * as ops from "./operations";

/** Rich, deterministic synthetic rows for every P0 screen. Built from operations.ts so counts match the Overview. */
const faker = new Faker({ locale: [en] });
faker.seed(20261203);

const hour = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const id = (p: string) => `${p}_${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;
const hex = (n: number) => faker.string.hexadecimal({ length: n, casing: "lower", prefix: "" });
const staff = ["James Whitaker", "Harry Collins", "William Hughes"] as const;

export function mask(contact: string): string {
  if (contact.includes("@")) {
    const [u = "", d = ""] = contact.split("@");
    return `${u.slice(0, 1)}***@${d}`;
  }
  return `${contact.slice(0, 2)}******${contact.slice(-2)}`;
}

function randomContact(slug: string): string {
  const pool = principals.filter((p) => p.tenantSlug === slug);
  return mask(faker.helpers.arrayElement(pool).contact);
}

export const dsrRows: Array<Dsr & { tenantSlug: string }> = ops.dsrs.map((d) => {
  const submitted = Date.parse(d.dueAt) - 30 * day;
  const timeline = [{ at: iso(submitted), actor: "Data Principal", note: "Request submitted via hosted page" }];
  if (d.status !== "submitted") timeline.push({ at: iso(submitted + 3 * hour), actor: "System", note: "Identity verified by OTP" });
  if (d.status === "in_progress" || d.status === "completed")
    timeline.push({ at: iso(submitted + day), actor: staff[0], note: "Fulfilment tasks routed to CRM and data warehouse owners" });
  if (d.status === "completed") timeline.push({ at: iso(submitted + 6 * day), actor: staff[0], note: "Response sent to Data Principal" });
  if (d.status === "rejected") timeline.push({ at: iso(submitted + 2 * day), actor: staff[1], note: "Rejected: identity could not be verified" });
  return {
    id: d.id,
    tenantSlug: d.tenantSlug,
    type: faker.helpers.arrayElement(["access", "correction", "completion", "erasure", "erasure", "nomination"] as const),
    status: d.status,
    maskedContact: randomContact(d.tenantSlug),
    channel: faker.helpers.arrayElement(["web", "mobile", "hosted_page"] as const),
    identityVerified: d.status !== "submitted",
    assignee: d.status === "submitted" ? null : faker.helpers.arrayElement(staff),
    submittedAt: iso(submitted),
    dueAt: d.dueAt,
    timeline,
  };
});

const grvSubjects: Array<[Grievance["category"], string]> = [
  ["consent_withdrawal", "Still receiving SMS after withdrawing marketing consent"],
  ["data_accuracy", "Wrong delivery address held on my profile"],
  ["notice_clarity", "Notice does not say which partners receive my data"],
  ["rights_delay", "No reply to my access request after 3 weeks"],
  ["other", "Unable to find the withdrawal link in the mobile app"],
];
export const grievanceRows: Array<Grievance & { tenantSlug: string }> = ops.grievances.map((g) => {
  const [category, subject] = faker.helpers.arrayElement(grvSubjects);
  return {
    id: g.id,
    tenantSlug: g.tenantSlug,
    subject,
    category,
    status: g.status,
    maskedContact: randomContact(g.tenantSlug),
    assignee: g.status === "open" ? null : faker.helpers.arrayElement(staff),
    openedAt: g.openedAt,
    dueAt: iso(Date.parse(g.openedAt) + 90 * day),
    closureNote: g.status === "resolved" ? "Issue confirmed and fixed; principal informed in writing." : null,
    evidence: g.status === "resolved" ? ["Response letter (PDF)", "Ledger extract for principal", "System change ticket"] : [],
  };
});

const breachMeta: Array<Pick<Breach, "title" | "severity" | "principalsAffected" | "dataCategories">> = [
  { title: "Misconfigured storage bucket exposed order exports", severity: "critical", principalsAffected: 12480, dataCategories: ["Name", "Delivery address", "Mobile number"] },
  { title: "Marketing email sent with recipients in CC", severity: "medium", principalsAffected: 214, dataCategories: ["Email address"] },
  { title: "Phishing compromise of a support agent mailbox", severity: "high", principalsAffected: 1830, dataCategories: ["Name", "Email address", "Account number"] },
];
export const breachRows: Array<Breach & { tenantSlug: string }> = ops.breaches.map((b, i) => {
  const meta = breachMeta[i % breachMeta.length] ?? breachMeta[0]!;
  return {
    id: b.id,
    tenantSlug: b.tenantSlug,
    ...meta,
    status: b.status,
    detectedAt: b.detectedAt,
    boardDeadlineAt: iso(Date.parse(b.detectedAt) + 72 * hour),
    boardNotifiedAt: b.status === "open" ? null : iso(Date.parse(b.detectedAt) + 40 * hour),
    principalsNotifiedAt: b.status === "open" ? null : iso(Date.parse(b.detectedAt) + 48 * hour),
    timeline: [
      { at: b.detectedAt, actor: "Security operations", note: "Incident detected and logged in the breach register" },
      { at: iso(Date.parse(b.detectedAt) + 2 * hour), actor: staff[0], note: "Containment confirmed; access revoked" },
      { at: iso(Date.parse(b.detectedAt) + 5 * hour), actor: "Security operations", note: "CERT-In report filed (6-hour window)" },
      ...(b.status === "open" ? [] : [{ at: iso(Date.parse(b.detectedAt) + 40 * hour), actor: staff[0], note: "Detailed report sent to the Data Protection Board" }]),
    ],
    principalNoticeDraft: `We are writing to tell you about a security incident affecting your ${meta.dataCategories.join(", ").toLowerCase()}. We have contained it and taken steps to prevent it happening again. You can contact our DPO at any time.`,
  };
});

export const packSections = ["Consent ledger proof", "Notice versions", "Rights requests", "Grievances", "Breach register", "Admin audit log"];
export const auditPackRows: Array<AuditPack & { tenantSlug: string }> = tenants.flatMap((t) =>
  ["Q3 2026", "Q2 2026", "FY 2025-26"].map((period, i) => ({
    id: id("pack"),
    tenantSlug: t.slug,
    period,
    requestedBy: staff[0],
    createdAt: iso(now - (20 + i * 90) * day),
    status: "ready" as const,
    sizeKb: faker.number.int({ min: 800, max: 9000 }),
    sections: packSections,
  })),
);

export const onboardingOrg = new Map(
  tenants.map((t) => [
    t.slug,
    {
      name: t.name,
      dpoEmail: t.dpoEmail,
      sector: t.slug === "consento" ? "Technology services" : t.slug === "hello-llp" ? "Professional services" : "IT and GRC services",
      region: "ap-south-1 (Mumbai)",
    },
  ]),
);

export function activeConsentsFor(slug: string, purposeId: string): number {
  const ids = new Set(principals.filter((p) => p.tenantSlug === slug).map((p) => p.id));
  return consents.filter((c) => ids.has(c.principalId) && c.purpose.id === purposeId && c.status === "granted").length;
}

export const noticeRows: Array<Notice & { tenantSlug: string }> = ops.notices.map((n, i) => {
  const purposes = purposesByTenant.get(n.tenantSlug) ?? [];
  const major = Number(n.version.slice(1, 2)) || 1;
  return {
    id: n.id,
    tenantSlug: n.tenantSlug,
    title: `${purposes[i % Math.max(purposes.length, 1)]?.name ?? "General"} notice`,
    version: n.version,
    status: n.status,
    languages: { en: true, hi: n.translated.hi, kn: n.translated.kn },
    purposeCount: 1 + (i % 4),
    updatedAt: iso(now - faker.number.int({ min: 1, max: 60 }) * day),
    author: "Oliver Bennett",
    versions: Array.from({ length: major }, (_, v) => ({
      version: `v${v + 1}.0`,
      publishedAt: iso(now - (major - v) * 70 * day),
      hash: hex(64),
    })),
  };
});

export const bannerByTenant = new Map<string, BannerConfig>(
  tenants.map((t) => [
    t.slug,
    {
      layout: "box",
      position: "bottom",
      title: "Your privacy choices",
      body: `${t.name} uses your data for the purposes below. Choose what you allow. You can withdraw at any time from the privacy link in the footer.`,
      acceptLabel: "Accept all",
      rejectLabel: "Reject all",
      customiseLabel: "Choose purposes",
      languages: ["English", "हिन्दी", "ಕನ್ನಡ"],
      impressions7d: t.slug === "hello-llp" ? 0 : faker.number.int({ min: 18000, max: 64000 }),
      acceptRate7d: t.slug === "hello-llp" ? 0 : faker.number.float({ min: 52, max: 78, fractionDigits: 1 }),
    },
  ]),
);

export const retentionRows: Array<RetentionRule & { tenantSlug: string }> = ops.tenantSetup.flatMap((s) =>
  (purposesByTenant.get(s.tenantSlug) ?? []).slice(0, s.retentionRules).map((p) => ({
    id: id("ret"),
    tenantSlug: s.tenantSlug,
    purposeName: p.name,
    retentionDays: p.retentionDays,
    action: faker.helpers.arrayElement(["delete", "anonymise"] as const),
    trigger: faker.helpers.arrayElement(["consent_withdrawn", "purpose_complete", "consent_expired"] as const),
    nextRunAt: iso(now + faker.number.int({ min: 1, max: 7 }) * day),
    pendingErasures: faker.number.int({ min: 0, max: 140 }),
  })),
);

const people: Array<[string, StaffUser["role"]]> = [
  ["Oliver Bennett", "admin"],
  ["James Whitaker", "dpo"],
  ["William Hughes", "dpo"],
  ["Harry Collins", "operator"],
  ["Thomas Fletcher", "operator"],
  ["Edward Clarke", "viewer"],
];
export const userRows: Array<StaffUser & { tenantSlug: string }> = tenants.flatMap((t) =>
  people.map(([name, role], i) => ({
    id: id("usr"),
    tenantSlug: t.slug,
    name,
    email: `${(name.split(" ")[0] ?? "user").toLowerCase()}@${t.slug}.example.in`,
    role,
    status: i === 4 ? ("invited" as const) : ("active" as const),
    mfa: role === "admin" || role === "dpo" || i % 2 === 0,
    lastActiveAt: i === 4 ? null : iso(now - faker.number.int({ min: 1, max: 72 }) * hour),
  })),
);

export const apiKeyRows: Array<ApiKey & { tenantSlug: string }> = ops.apiKeys.map((k, i) => ({
  id: k.id,
  tenantSlug: k.tenantSlug,
  name: k.name,
  prefix: `ck_${i % 3 === 1 ? "test" : "live"}_${hex(6)}`,
  scopes: i % 3 === 2 ? ["consent:read"] : ["consent:read", "consent:write"],
  status: i % 3 === 2 ? ("revoked" as const) : ("active" as const),
  createdAt: iso(now - faker.number.int({ min: 30, max: 300 }) * day),
  lastUsedAt: k.lastUsedAt,
}));

const endpointHosts = ["crm-sync", "data-warehouse", "email-platform", "loyalty", "support-desk", "erp"];
const events = ["consent.granted", "consent.withdrawn", "consent.expired", "dsr.created", "notice.published"];
export const webhookEndpoints: Array<WebhookEndpoint & { tenantSlug: string }> = [];
export const webhookDeliveryRows: Array<WebhookDelivery & { tenantSlug: string }> = [];
for (const t of tenants) {
  const byEndpoint = new Map<string, typeof ops.webhookDeliveries>();
  for (const d of ops.webhookDeliveries.filter((x) => x.tenantSlug === t.slug)) {
    byEndpoint.set(d.endpointId, [...(byEndpoint.get(d.endpointId) ?? []), d]);
  }
  [...byEndpoint.entries()].forEach(([endpointId, ds], i) => {
    const ok = ds.filter((d) => d.ok).length;
    const latest = [...ds].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    webhookEndpoints.push({
      id: endpointId,
      tenantSlug: t.slug,
      url: `https://${endpointHosts[i % endpointHosts.length]}.${t.slug}.example.in/hooks/consent`,
      events: faker.helpers.arrayElements(events, { min: 2, max: 4 }),
      status: i === 5 ? "paused" : "active",
      successRate7d: Math.round((ok / ds.length) * 1000) / 10,
      lastDeliveryAt: latest?.at ?? null,
    });
    for (const d of ds) {
      webhookDeliveryRows.push({
        id: d.id,
        tenantSlug: t.slug,
        endpointId,
        event: faker.helpers.arrayElement(events),
        at: d.at,
        httpStatus: d.ok ? 200 : faker.helpers.arrayElement([500, 502, 504, 410]),
        ok: d.ok,
        attempts: d.ok ? 1 : faker.number.int({ min: 3, max: 6 }),
      });
    }
  });
}
webhookDeliveryRows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

const supportMeta = [
  { requestedBy: "Globals support (Rahul, demo)", reason: "Ticket GS-4821: banner not rendering on checkout page", scope: "Read-only: banner config, SDK logs" },
  { requestedBy: "Globals support (Meera, demo)", reason: "Ticket GS-4710: webhook retries failing", scope: "Read-only: webhook delivery log" },
  { requestedBy: "Globals support (Rahul, demo)", reason: "Ticket GS-4902: notice translation review", scope: "Read-only: notices" },
];
export const supportRows: Array<SupportRequest & { tenantSlug: string }> = ops.supportRequests.map((s, i) => ({
  id: s.id,
  tenantSlug: s.tenantSlug,
  ...(supportMeta[i % supportMeta.length] ?? supportMeta[0]!),
  durationHours: 4,
  status: s.status,
  requestedAt: s.requestedAt,
  expiresAt: s.status === "approved" ? iso(Date.parse(s.requestedAt) + 4 * hour) : null,
}));

export const auditLogRows: Array<AuditLogEvent & { tenantSlug: string }> = ops.auditEvents
  .map((e) => ({ ...e, ip: `10.20.${faker.number.int({ min: 0, max: 255 })}.${faker.number.int({ min: 1, max: 254 })}` }))
  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

export function logAudit(tenantSlug: string, actorName: string, action: string, target: string): void {
  auditLogRows.unshift({ id: id("aud"), tenantSlug, at: new Date().toISOString(), actorName, action, target, ip: "10.20.0.1" });
}
