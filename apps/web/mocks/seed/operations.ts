import { Faker, en } from "@faker-js/faker";
import { day, now, purposesByTenant, tenants } from "./index";

/**
 * Deterministic synthetic operational data (DSRs, grievances, breaches, integrations, notices, audit log)
 * used by the Overview and, later, the queue screens. Synthetic only; domains are example.in.
 */
const faker = new Faker({ locale: [en] });
faker.seed(20261202);

const hour = 3_600_000;
const id = (prefix: string) => `${prefix}_${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;
const iso = (ms: number) => new Date(ms).toISOString();

export interface DsrRecord { id: string; tenantSlug: string; status: "submitted" | "in_progress" | "completed" | "rejected"; dueAt: string }
export interface GrievanceRecord { id: string; tenantSlug: string; status: "open" | "escalated" | "resolved"; openedAt: string }
export interface BreachRecord { id: string; tenantSlug: string; status: "open" | "notified" | "closed"; detectedAt: string }
export interface WebhookDeliveryRecord { id: string; tenantSlug: string; endpointId: string; at: string; ok: boolean }
export interface NoticeRecord {
  id: string;
  tenantSlug: string;
  version: string;
  status: "draft" | "pending_approval" | "published";
  translated: Record<"hi" | "kn", boolean>;
}
export interface SupportRequestRecord { id: string; tenantSlug: string; status: "pending" | "approved" | "denied"; requestedAt: string }
export interface PreErasureRecord { id: string; tenantSlug: string; dueAt: string }
export interface SdkDomainRecord { tenantSlug: string; domain: string; lastSeenAt: string | null }
export interface ApiKeyRecord { id: string; tenantSlug: string; name: string; lastUsedAt: string | null }
export interface AuditEventRecord { id: string; tenantSlug: string; at: string; actorName: string; action: string; target: string }
export interface TenantSetupRecord { tenantSlug: string; bannerLive: boolean; dpoContactSet: boolean; retentionRules: number; webhookEndpoints: number }

const slugs = tenants.map((t) => t.slug);
/** hello-llp is the "still onboarding" tenant so the checklist has incomplete items. */
const onboarding = "hello-llp";

export const dsrs: DsrRecord[] = slugs.flatMap((tenantSlug) =>
  Array.from({ length: tenantSlug === onboarding ? 4 : 18 }, () => {
    const status = faker.helpers.arrayElement(["submitted", "in_progress", "in_progress", "completed", "rejected"] as const);
    return { id: id("dsr"), tenantSlug, status, dueAt: iso(now + faker.number.int({ min: -2, max: 30 }) * day + faker.number.int({ min: 0, max: 20 }) * hour) };
  }),
);

export const grievances: GrievanceRecord[] = slugs.flatMap((tenantSlug) =>
  Array.from({ length: tenantSlug === onboarding ? 1 : 7 }, () => ({
    id: id("grv"),
    tenantSlug,
    status: faker.helpers.arrayElement(["open", "open", "escalated", "resolved"] as const),
    openedAt: iso(now - faker.number.int({ min: 2, max: 88 }) * day),
  })),
);

export const breaches: BreachRecord[] = [
  { id: id("brc"), tenantSlug: "globals-inc", status: "open", detectedAt: iso(now - 30 * hour) },
  { id: id("brc"), tenantSlug: "globals-inc", status: "notified", detectedAt: iso(now - 20 * day) },
  { id: id("brc"), tenantSlug: "consento", status: "open", detectedAt: iso(now - 60 * hour) },
];

export const webhookDeliveries: WebhookDeliveryRecord[] = slugs.flatMap((tenantSlug) =>
  tenantSlug === onboarding
    ? []
    : Array.from({ length: 6 }, () => id("whe")).flatMap((endpointId) =>
        Array.from({ length: 20 }, () => ({
          id: id("whd"),
          tenantSlug,
          endpointId,
          at: iso(now - faker.number.int({ min: 0, max: 9 * 24 }) * hour),
          ok: faker.number.int({ min: 1, max: 100 }) > 6,
        })),
      ),
);

export const notices: NoticeRecord[] = slugs.flatMap((tenantSlug) =>
  (purposesByTenant.get(tenantSlug) ?? []).slice(0, tenantSlug === onboarding ? 3 : 12).map((_, i) => ({
    id: id("ntc"),
    tenantSlug,
    version: `v${1 + (i % 3)}.${i % 2}`,
    status: tenantSlug === onboarding ? ("draft" as const) : i % 5 === 0 ? ("pending_approval" as const) : ("published" as const),
    translated: { hi: faker.datatype.boolean({ probability: 0.8 }), kn: faker.datatype.boolean({ probability: 0.45 }) },
  })),
);

export const supportRequests: SupportRequestRecord[] = [
  { id: id("sup"), tenantSlug: "globals-inc", status: "pending", requestedAt: iso(now - 3 * hour) },
  { id: id("sup"), tenantSlug: "globals-inc", status: "approved", requestedAt: iso(now - 6 * day) },
  { id: id("sup"), tenantSlug: "consento", status: "pending", requestedAt: iso(now - 26 * hour) },
];

export const preErasureNotices: PreErasureRecord[] = slugs.flatMap((tenantSlug) =>
  tenantSlug === onboarding ? [] : Array.from({ length: 5 }, () => ({ id: id("pre"), tenantSlug, dueAt: iso(now + faker.number.int({ min: 1, max: 20 }) * day) })),
);

export const sdkDomains: SdkDomainRecord[] = [
  { tenantSlug: "globals-inc", domain: "shop.globals-inc.example.in", lastSeenAt: iso(now - 4 * 60_000) },
  { tenantSlug: "globals-inc", domain: "m.globals-inc.example.in", lastSeenAt: iso(now - 2 * day) },
  { tenantSlug: "consento", domain: "netbanking.consento.example.in", lastSeenAt: iso(now - 12 * 60_000) },
  { tenantSlug: "hello-llp", domain: "care.hello-llp.example.in", lastSeenAt: null },
];

export const apiKeys: ApiKeyRecord[] = slugs.flatMap((tenantSlug) =>
  tenantSlug === onboarding
    ? []
    : [
        { id: id("key"), tenantSlug, name: "Production backend", lastUsedAt: iso(now - faker.number.int({ min: 1, max: 50 }) * 60_000) },
        { id: id("key"), tenantSlug, name: "Staging", lastUsedAt: iso(now - faker.number.int({ min: 1, max: 9 }) * day) },
        { id: id("key"), tenantSlug, name: "Legacy CRM sync", lastUsedAt: null },
      ],
);

const actors = ["Oliver Bennett", "James Whitaker", "Harry Collins"];
const actions: Array<[string, string]> = [
  ["published notice", "Marketing by email v2.1"],
  ["updated purpose", "Analytics cookies"],
  ["rotated API key", "Production backend"],
  ["approved support access", "Globals support request"],
  ["assigned rights request", "Erasure request"],
  ["escalated grievance", "Delayed withdrawal"],
  ["replayed webhook delivery", "crm-sync endpoint"],
  ["changed banner theme", "Default banner"],
  ["invited user", "Operator role"],
  ["exported audit pack", "Q3 2026"],
];

export const auditEvents: AuditEventRecord[] = slugs.flatMap((tenantSlug) =>
  Array.from({ length: tenantSlug === onboarding ? 3 : 30 }, () => {
    const [action, target] = faker.helpers.arrayElement(actions);
    return { id: id("aud"), tenantSlug, at: iso(now - faker.number.int({ min: 1, max: 14 * 24 * 60 }) * 60_000), actorName: faker.helpers.arrayElement(actors), action, target };
  }),
);

export const tenantSetup: TenantSetupRecord[] = [
  { tenantSlug: "globals-inc", bannerLive: true, dpoContactSet: true, retentionRules: 8, webhookEndpoints: 6 },
  { tenantSlug: "consento", bannerLive: true, dpoContactSet: true, retentionRules: 0, webhookEndpoints: 6 },
  { tenantSlug: "hello-llp", bannerLive: false, dpoContactSet: true, retentionRules: 0, webhookEndpoints: 0 },
];
