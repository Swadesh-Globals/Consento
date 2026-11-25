import { Faker, en } from "@faker-js/faker";
import type { z } from "zod";
import type {
  Assessment,
  Branding,
  CollectionChannel,
  ErasureItem,
  GuardianConsent,
  InteropOverview,
  InventoryItem,
  LegitimateUse,
  LogRetention,
  NotificationItem,
  Processor,
  ReportDefinition,
  ResponseTemplate,
  Sandbox,
  SsoConfig,
  Usage,
  VerificationSetting,
  WithdrawalPropagation,
  WorkflowRule,
} from "@consent/schemas";
import { consents, day, now, principals, purposesByTenant, tenants } from "./index";
import { mask } from "./screens";

/** Deterministic synthetic data for the extended programme screens. Synthetic only; domains are example.in. */
const faker = new Faker({ locale: [en] });
faker.seed(20261204);

type Row<S extends z.ZodType> = z.infer<S> & { tenantSlug: string };
const hour = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const id = (p: string) => `${p}_${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;
const slugs = tenants.map((t) => t.slug);
const onboarding = "hello-llp";
const contactOf = (principalId: string) => mask(principals.find((p) => p.id === principalId)?.contact ?? "0000000000");
const randomContact = (slug: string) => mask(faker.helpers.arrayElement(principals.filter((p) => p.tenantSlug === slug)).contact);
const purposeNames = (slug: string) => (purposesByTenant.get(slug) ?? []).map((p) => p.name);

const systems = ["CRM", "Data warehouse", "Email platform", "Loyalty engine"];
const processorNames = ["Email delivery provider", "SMS gateway provider", "Analytics provider", "Logistics provider", "Call-centre provider", "Pay-later provider"];

export const templates: Array<z.infer<typeof ResponseTemplate>> = [
  { id: "tpl_access", requestType: "access", name: "Access: summary of personal data", body: "We have attached a summary of the personal data we process about you, the purposes, and the processors we share it with." },
  { id: "tpl_correction", requestType: "correction", name: "Correction: data updated", body: "We have corrected the details you asked us to update. The change has been passed on to our processors." },
  { id: "tpl_completion", requestType: "completion", name: "Completion: record completed", body: "We have completed your record with the information you provided." },
  { id: "tpl_erasure", requestType: "erasure", name: "Erasure: data erased", body: "We have erased your personal data, except where the law requires us to keep it. An erasure certificate is attached." },
  { id: "tpl_nomination", requestType: "nomination", name: "Nomination: nominee recorded", body: "We have recorded your nominee, who may exercise your rights in the event of death or incapacity." },
  { id: "tpl_reject", requestType: "any", name: "Rejection: identity not verified", body: "We could not verify your identity, so we cannot act on this request. You can submit it again with verification." },
];

export const withdrawals: Array<Row<typeof WithdrawalPropagation>> = slugs.flatMap((slug) => {
  if (slug === onboarding) return [];
  const ids = new Set(principals.filter((p) => p.tenantSlug === slug).map((p) => p.id));
  return consents
    .filter((c) => ids.has(c.principalId) && c.status === "withdrawn")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 24)
    .map((c, i) => {
      const at = Date.parse(c.updatedAt);
      const targets = [
        ...faker.helpers.arrayElements(systems, { min: 2, max: 3 }).map((name) => ({ name, kind: "system" as const })),
        ...faker.helpers.arrayElements(processorNames.slice(0, 3), { min: 1, max: 2 }).map((name) => ({ name, kind: "processor" as const })),
      ].map((t) => {
        const status = i < 4 ? faker.helpers.arrayElement(["pending", "confirmed", "failed"] as const) : ("confirmed" as const);
        return { ...t, status, ackAt: status === "confirmed" ? iso(at + faker.number.int({ min: 5, max: 55 }) * 1000) : null };
      });
      return { id: id("wdl"), tenantSlug: slug, maskedContact: contactOf(c.principalId), purposeName: c.purpose.name, withdrawnAt: c.updatedAt, targets };
    });
});

export const guardianConsents: Array<Row<typeof GuardianConsent>> = slugs.flatMap((slug) =>
  Array.from({ length: slug === onboarding ? 2 : 9 }, (_, i) => {
    const kind = i % 4 === 3 ? ("disability" as const) : ("child" as const);
    return {
      id: id("gdn"),
      tenantSlug: slug,
      kind,
      principalMasked: randomContact(slug),
      guardianMasked: randomContact(slug),
      ageGate: kind === "child" ? ("under_18" as const) : ("not_applicable" as const),
      method: kind === "child" ? faker.helpers.arrayElement(["digilocker_token", "existing_adult_account", "id_document"] as const) : ("court_order" as const),
      purposeName: faker.helpers.arrayElement(purposeNames(slug)),
      status: faker.helpers.arrayElement(["pending", "pending", "verified", "rejected"] as const),
      submittedAt: iso(now - faker.number.int({ min: 1, max: 20 * 24 }) * hour),
    };
  }),
);

const ruleClasses = ["Rule 8 class: e-commerce (3 years inactivity)", "Rule 8 class: online gaming (3 years inactivity)", "Purpose complete", "Consent withdrawn"];
export const erasures: Array<Row<typeof ErasureItem>> = slugs.flatMap((slug) =>
  slug === onboarding
    ? []
    : Array.from({ length: 16 }, (_, i) => {
        const scheduled = now + faker.number.int({ min: -10, max: 14 }) * day;
        const status: z.infer<typeof ErasureItem>["status"] =
          scheduled < now ? (i % 6 === 0 ? "held" : "erased") : scheduled - now <= 2 * day ? "notice_sent" : "notice_pending";
        return {
          id: id("ers"),
          tenantSlug: slug,
          maskedContact: randomContact(slug),
          purposeName: faker.helpers.arrayElement(purposeNames(slug)),
          ruleClass: faker.helpers.arrayElement(ruleClasses),
          scheduledAt: iso(scheduled),
          noticeSentAt: status === "notice_pending" ? null : iso(scheduled - 48 * hour),
          status,
          certificateId: status === "erased" ? `CERT-${faker.string.alphanumeric({ length: 8, casing: "upper" })}` : null,
        };
      }),
);

export const legitimateUses: Array<Row<typeof LegitimateUse>> = slugs.flatMap((slug) => [
  { id: id("lgu"), tenantSlug: slug, name: "Fraud prevention", section: "Sec 7(a): voluntarily provided for a specified purpose", justification: "Principal shares device and transaction data to complete a payment; fraud screening is needed to process it.", dataCategories: ["Device identifiers", "Transaction history"], systems: ["Payments", "Risk engine"], owner: "James Whitaker", reviewedAt: iso(now - 40 * day) },
  { id: id("lgu"), tenantSlug: slug, name: "Statutory tax records", section: "Sec 7(c): compliance with law", justification: "Invoices and GST records kept for the period required under tax law.", dataCategories: ["Name", "Billing address", "GSTIN"], systems: ["ERP"], owner: "James Whitaker", reviewedAt: iso(now - 75 * day) },
  { id: id("lgu"), tenantSlug: slug, name: "Employee payroll", section: "Sec 7(i): employment purposes", justification: "Processing of employee data for salary, statutory deductions and attendance.", dataCategories: ["Name", "Bank account", "PAN"], systems: ["HRMS"], owner: "William Hughes", reviewedAt: iso(now - 20 * day) },
  { id: id("lgu"), tenantSlug: slug, name: "Medical emergency response", section: "Sec 7(f): medical emergency", justification: "Sharing contact and location with emergency services when life is at risk.", dataCategories: ["Mobile number", "Approximate location"], systems: ["Support desk"], owner: "William Hughes", reviewedAt: iso(now - 120 * day) },
]);

export const reports: Array<Row<typeof ReportDefinition>> = slugs.flatMap((slug) => [
  { id: id("rpt"), tenantSlug: slug, name: "Consent ledger extract", description: "Every consent event with hashes, for a chosen period.", formats: ["CSV"], lastRunAt: iso(now - 3 * day) },
  { id: id("rpt"), tenantSlug: slug, name: "Rights request SLA compliance", description: "Requests by type, time to close and SLA met or missed.", formats: ["PDF", "CSV"], lastRunAt: iso(now - 9 * day) },
  { id: id("rpt"), tenantSlug: slug, name: "Grievance redressal summary", description: "Grievances by category, closure time and 90-day cap.", formats: ["PDF", "CSV"], lastRunAt: null },
  { id: id("rpt"), tenantSlug: slug, name: "Board-ready compliance summary", description: "One-page summary of consent, rights, grievances and breaches for the Board.", formats: ["PDF"], lastRunAt: iso(now - 30 * day) },
  { id: id("rpt"), tenantSlug: slug, name: "Withdrawal propagation report", description: "Withdrawals and downstream acknowledgement times.", formats: ["CSV"], lastRunAt: null },
]);

export const assessments: Array<Row<typeof Assessment>> = slugs.flatMap((slug) => [
  { id: id("dpia"), tenantSlug: slug, title: "DPIA: personalised recommendations", kind: "dpia", status: "completed", owner: "James Whitaker", dueAt: iso(now - 30 * day), evidenceLinked: 14, openFindings: 0 },
  { id: id("dpia"), tenantSlug: slug, title: "DPIA: credit assessment", kind: "dpia", status: "in_progress", owner: "William Hughes", dueAt: iso(now + 25 * day), evidenceLinked: 8, openFindings: 3 },
  { id: id("dpia"), tenantSlug: slug, title: "Annual independent data audit FY 2026-27", kind: "annual_audit", status: "planned", owner: "James Whitaker", dueAt: iso(now + 120 * day), evidenceLinked: 22, openFindings: 0 },
]);

export const processors: Array<Row<typeof Processor>> = slugs.flatMap((slug) =>
  processorNames.slice(0, slug === onboarding ? 2 : 6).map((name, i) => {
    const dpaStatus = i === 3 ? ("expired" as const) : i === 5 ? ("pending" as const) : ("signed" as const);
    return {
      id: id("prc"),
      tenantSlug: slug,
      name,
      service: ["Email delivery", "SMS delivery", "Product analytics", "Order delivery", "Customer support", "Pay-later credit"][i] ?? "Other",
      purposes: faker.helpers.arrayElements(purposeNames(slug), { min: 1, max: 3 }),
      dpaStatus,
      dpaExpiresAt: dpaStatus === "pending" ? null : iso(now + (dpaStatus === "expired" ? -15 : 200) * day),
      region: i === 2 ? "ap-south-1 + eu-west-1" : "ap-south-1",
      instructionsPending: i < 2 ? faker.number.int({ min: 0, max: 6 }) : 0,
      lastInstructionAt: iso(now - faker.number.int({ min: 1, max: 72 }) * hour),
    };
  }),
);

export const inventory: Array<Row<typeof InventoryItem>> = slugs.flatMap((slug) =>
  (purposesByTenant.get(slug) ?? []).map((p, i) => ({
    id: id("inv"),
    tenantSlug: slug,
    purposeName: p.name,
    dataCategories: p.dataElements.map((e) => e.name),
    systems: faker.helpers.arrayElements(systems, { min: 1, max: 3 }),
    retentionDays: p.retentionDays,
    source: i % 3 === 0 ? ("discovery" as const) : ("manual" as const),
  })),
);

export const channels: Array<Row<typeof CollectionChannel>> = slugs.flatMap((slug) => {
  const live = slug !== onboarding;
  return [
    { tenantSlug: slug, key: "web" as const, enabled: true, consents30d: live ? 18420 : 0, attestationRequired: false, lastCaptureAt: live ? iso(now - 4 * 60_000) : null },
    { tenantSlug: slug, key: "app" as const, enabled: live, consents30d: live ? 9110 : 0, attestationRequired: false, lastCaptureAt: live ? iso(now - 12 * 60_000) : null },
    { tenantSlug: slug, key: "call_centre" as const, enabled: live, consents30d: live ? 1240 : 0, attestationRequired: true, lastCaptureAt: live ? iso(now - 2 * hour) : null },
    { tenantSlug: slug, key: "kiosk" as const, enabled: slug === "consento", consents30d: slug === "consento" ? 380 : 0, attestationRequired: true, lastCaptureAt: slug === "consento" ? iso(now - 5 * hour) : null },
    { tenantSlug: slug, key: "paper" as const, enabled: slug === "consento", consents30d: slug === "consento" ? 96 : 0, attestationRequired: true, lastCaptureAt: slug === "consento" ? iso(now - 3 * day) : null },
  ];
});

const requestTypes = ["access", "correction", "completion", "erasure", "nomination", "grievance"];
export const verification: Array<Row<typeof VerificationSetting>> = slugs.flatMap((slug) =>
  requestTypes.map((requestType) => ({
    tenantSlug: slug,
    requestType,
    method: requestType === "erasure" || requestType === "nomination" ? (slug === "consento" ? "kyc" : "otp_sms") : requestType === "grievance" ? "otp_email" : "otp_sms",
    strength: requestType === "erasure" || requestType === "nomination" ? "high" : requestType === "grievance" ? "low" : "medium",
    reverifyDays: requestType === "grievance" ? 0 : 30,
  })),
);

export const workflows: Array<Row<typeof WorkflowRule>> = slugs.flatMap((slug) =>
  requestTypes.map((requestType) => ({
    tenantSlug: slug,
    requestType,
    slaDays: requestType === "grievance" ? 30 : requestType === "erasure" ? 15 : 30,
    approver: requestType === "erasure" || requestType === "nomination" ? "DPO" : "Operator",
    autoAssign: requestType === "grievance" ? "least_loaded" : "round_robin",
    escalateAfterDays: requestType === "grievance" ? 21 : 20,
    escalateTo: requestType === "grievance" ? "Grievance officer" : "DPO",
  })),
);

export const branding = new Map<string, Branding>(
  tenants.map((t) => [
    t.slug,
    {
      displayName: t.name,
      logoFile: `${t.slug}-logo.svg`,
      primaryColour: t.slug === "consento" ? "Teal 700" : t.slug === "hello-llp" ? "Green 700" : "Navy 900",
      customDomain: t.slug === "hello-llp" ? "" : `privacy.${t.slug}.example.in`,
      domainStatus: t.slug === "hello-llp" ? "not_set" : t.slug === "consento" ? "pending_dns" : "verified",
      emailSender: `privacy@${t.slug}.example.in`,
      senderVerified: t.slug !== "hello-llp",
    },
  ]),
);

export const sso = new Map<string, SsoConfig>(
  tenants.map((t) => [
    t.slug,
    t.slug === "hello-llp"
      ? { protocol: "oidc", idp: "", status: "not_configured", enforced: false, scim: { enabled: false, lastSyncAt: null, usersProvisioned: 0, groupsMapped: 0 } }
      : {
          protocol: t.slug === "consento" ? "saml" : "oidc",
          idp: t.slug === "consento" ? "Corporate IdP (SAML)" : "Corporate IdP (OIDC)",
          status: t.slug === "consento" ? "active" : "testing",
          enforced: t.slug === "consento",
          scim: { enabled: t.slug === "consento", lastSyncAt: t.slug === "consento" ? iso(now - 40 * 60_000) : null, usersProvisioned: t.slug === "consento" ? 42 : 0, groupsMapped: t.slug === "consento" ? 4 : 0 },
        },
  ]),
);

export const logRetention = new Map<string, LogRetention>(
  tenants.map((t) => [
    t.slug,
    {
      minimumDays: 365,
      items: [
        { logType: "Consent ledger", retentionDays: 2555, region: "ap-south-1", immutable: true },
        { logType: "Admin audit log", retentionDays: t.slug === "consento" ? 2555 : 365, region: "ap-south-1", immutable: true },
        { logType: "Authentication events", retentionDays: 365, region: "ap-south-1", immutable: true },
        { logType: "API access logs", retentionDays: 365, region: "ap-south-1", immutable: false },
        { logType: "Webhook delivery logs", retentionDays: 365, region: "ap-south-1", immutable: false },
        { logType: "Support-access sessions", retentionDays: 730, region: "ap-south-1", immutable: true },
      ],
    },
  ]),
);

export const interop: InteropOverview = {
  apiVersion: "cm-interop v0 (draft, aligned to Rule 4 / Schedule I)",
  endpoints: [
    { method: "POST", path: "/cm/v0/consent-requests", description: "Receive a consent request routed by a Consent Manager", status: "draft" },
    { method: "GET", path: "/cm/v0/consent-artefacts/{id}", description: "Fetch a signed consent artefact", status: "available" },
    { method: "POST", path: "/cm/v0/consent-artefacts/{id}/revoke", description: "Withdrawal notified by a Consent Manager", status: "draft" },
    { method: "POST", path: "/cm/v0/notifications", description: "Push consent status changes to the Consent Manager", status: "draft" },
    { method: "GET", path: "/cm/v0/ledger/verify", description: "Public ledger verification for a consent ID", status: "available" },
  ],
  consentManagers: [
    { name: "Registered Consent Manager A (placeholder)", status: "not_connected" },
    { name: "Globals Inc Consent Manager (if registered)", status: "testing" },
  ],
};

export const notifications: Array<Row<typeof NotificationItem>> = slugs.flatMap((slug) =>
  [
    { severity: "critical" as const, title: "Breach: 72-hour Board deadline in under 24 hours", link: "/breaches", channel: "email" as const },
    { severity: "high" as const, title: "3 rights requests breach SLA within 48 hours", link: "/dsr", channel: "in_app" as const },
    { severity: "high" as const, title: "Webhook endpoint crm-sync failing (5 deliveries)", link: "/webhooks", channel: "email" as const },
    { severity: "medium" as const, title: "New grievance received", link: "/grievances-queue", channel: "sms" as const },
    { severity: "medium" as const, title: "Withdrawal not yet acknowledged by Email platform", link: "/withdrawals", channel: "in_app" as const },
    { severity: "medium" as const, title: "Guardian consent awaiting verification", link: "/guardian-consents", channel: "in_app" as const },
    { severity: "low" as const, title: "Pre-erasure notices sent for 4 principals", link: "/erasure", channel: "in_app" as const },
    { severity: "low" as const, title: "DPA with Logistics provider has expired", link: "/processors", channel: "email" as const },
  ].map((n, i) => ({ ...n, id: id("ntf"), tenantSlug: slug, at: iso(now - (i * 3 + 1) * hour), read: i > 3 })),
);

export const sandboxes = new Map<string, Sandbox>(
  tenants.map((t) => [
    t.slug,
    {
      enabled: true,
      slug: `${t.slug}-sandbox`,
      createdAt: iso(now - 60 * day),
      seededPrincipals: 50,
      apiKeyPrefix: "ck_test_",
      lastResetAt: iso(now - 4 * day),
      liveSince: t.slug === onboarding ? null : iso(now - 30 * day),
    },
  ]),
);

export const usage = new Map<string, Usage>(
  tenants.map((t) => {
    const live = t.slug !== onboarding;
    const daily = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * day).toISOString().slice(0, 10),
      consents: live ? faker.number.int({ min: 600, max: 1400 }) : 0,
      apiCalls: live ? faker.number.int({ min: 9000, max: 26000 }) : 0,
    }));
    return [
      t.slug,
      {
        period: "Nov 2026",
        consents: daily.reduce((s, d) => s + d.consents, 0),
        consentLimit: 50000,
        rightsRequests: live ? 18 : 4,
        apiCalls: daily.reduce((s, d) => s + d.apiCalls, 0),
        webhookDeliveries: live ? 14820 : 0,
        daily,
      },
    ];
  }),
);
