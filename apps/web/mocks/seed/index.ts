import { Faker, en_IN, en } from "@faker-js/faker";
import type { Channel, ConsentArtefact, LedgerEntry, Purpose, TenantSummary } from "@consent/schemas";

/** Deterministic synthetic data only. Domains are example.in; no real people or clients. */
const faker = new Faker({ locale: [en_IN, en] });
faker.seed(20261201);

const hex64 = () => faker.string.hexadecimal({ length: 64, casing: "lower", prefix: "" });
const id = (prefix: string) => `${prefix}_${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;

export const tenants: TenantSummary[] = [
  { id: "ten_globals", slug: "globals-inc", name: "Globals Inc", dpoEmail: "dpo@globals-inc.example.in", logoUrl: null },
  { id: "ten_consento", slug: "consento", name: "Consento Pvt Ltd", dpoEmail: "dpo@consento.example.in", logoUrl: null },
  { id: "ten_hello", slug: "hello-llp", name: "Hello LLP", dpoEmail: "dpo@hello-llp.example.in", logoUrl: null },
];

const purposeTemplates: Array<Omit<Purpose, "id" | "dataElements"> & { elements: Array<[string, Purpose["dataElements"][number]["category"]]> }> = [
  { name: "Order fulfilment", description: "Process, ship and deliver your orders.", lawfulBasis: "consent", retentionDays: 365, mandatory: true, elements: [["Name", "identity"], ["Delivery address", "contact"], ["Mobile number", "contact"]] },
  { name: "Marketing by email", description: "Send offers and product news by email.", lawfulBasis: "consent", retentionDays: 730, mandatory: false, elements: [["Email address", "contact"], ["Purchase history", "behavioural"]] },
  { name: "Marketing by SMS and WhatsApp", description: "Send offers by SMS and WhatsApp.", lawfulBasis: "consent", retentionDays: 730, mandatory: false, elements: [["Mobile number", "contact"]] },
  { name: "Personalised recommendations", description: "Suggest products based on what you browse and buy.", lawfulBasis: "consent", retentionDays: 365, mandatory: false, elements: [["Browsing history", "behavioural"], ["Purchase history", "behavioural"]] },
  { name: "Analytics cookies", description: "Measure how the website is used to improve it.", lawfulBasis: "consent", retentionDays: 395, mandatory: false, elements: [["Device identifiers", "device"], ["Pages visited", "behavioural"]] },
  { name: "Credit assessment", description: "Check eligibility for pay-later and EMI options.", lawfulBasis: "consent", retentionDays: 1825, mandatory: false, elements: [["PAN", "financial"], ["Income range", "financial"]] },
  { name: "Customer support", description: "Answer your queries and resolve complaints.", lawfulBasis: "consent", retentionDays: 365, mandatory: false, elements: [["Name", "identity"], ["Email address", "contact"], ["Call recordings", "other"]] },
  { name: "Partner offers", description: "Share your contact with selected partners for their offers.", lawfulBasis: "consent", retentionDays: 365, mandatory: false, elements: [["Email address", "contact"], ["Mobile number", "contact"]] },
  { name: "Location-based offers", description: "Show offers from stores near you.", lawfulBasis: "consent", retentionDays: 180, mandatory: false, elements: [["Approximate location", "device"]] },
  { name: "Loyalty programme", description: "Track and reward your purchases.", lawfulBasis: "consent", retentionDays: 1095, mandatory: false, elements: [["Name", "identity"], ["Purchase history", "behavioural"]] },
  { name: "Surveys and feedback", description: "Invite you to share feedback about our services.", lawfulBasis: "consent", retentionDays: 365, mandatory: false, elements: [["Email address", "contact"]] },
  { name: "Fraud prevention", description: "Detect and prevent fraudulent transactions.", lawfulBasis: "legitimate_use", retentionDays: 1825, mandatory: true, elements: [["Device identifiers", "device"], ["Transaction history", "financial"]] },
];

export const purposesByTenant = new Map<string, Purpose[]>(
  tenants.map((t) => [
    t.slug,
    purposeTemplates.map((p) => ({
      id: id("pur"),
      name: p.name,
      description: p.description,
      lawfulBasis: p.lawfulBasis,
      retentionDays: p.retentionDays,
      mandatory: p.mandatory,
      dataElements: p.elements.map(([name, category]) => ({ id: id("de"), name, category })),
    })),
  ]),
);

export interface PrincipalRecord {
  id: string;
  tenantSlug: string;
  contact: string;
}

export const principals: PrincipalRecord[] = tenants.flatMap((t) =>
  Array.from({ length: Math.ceil(500 / tenants.length) }, (_, i) => ({
    id: id("dp"),
    tenantSlug: t.slug,
    contact: i % 3 === 0 ? `user${i}@mail.example.in` : `9${faker.string.numeric(9)}`,
  })),
);

const channels: Channel[] = ["web", "mobile", "api", "hosted_page"];
export const noticeVersions = ["v1.0", "v1.1", "v2.0", "v2.1"] as const;

export const consents: ConsentArtefact[] = [];
export const ledger: Array<LedgerEntry & { principalId: string; tenantSlug: string }> = [];

const chainHead = new Map<string, string>();
const seqByTenant = new Map<string, number>();

export function appendLedger(
  tenantSlug: string,
  principalId: string,
  consent: ConsentArtefact,
  event: LedgerEntry["event"],
  at: string,
): void {
  const prevHash = chainHead.get(tenantSlug) ?? "0".repeat(64);
  const entryHash = hex64();
  const seq = (seqByTenant.get(tenantSlug) ?? 0) + 1;
  seqByTenant.set(tenantSlug, seq);
  chainHead.set(tenantSlug, entryHash);
  ledger.push({
    seq,
    consentId: consent.id,
    purposeName: consent.purpose.name,
    event,
    at,
    channel: consent.channel,
    entryHash,
    prevHash,
    principalId,
    tenantSlug,
  });
}

export const now = new Date("2026-11-20T09:00:00+05:30").getTime();
export const day = 86_400_000;

for (const p of principals) {
  const purposes = purposesByTenant.get(p.tenantSlug) ?? [];
  const chosen = faker.helpers.arrayElements(purposes, { min: 4, max: 9 });
  for (const purpose of chosen) {
    const grantedAt = new Date(now - faker.number.int({ min: 5, max: 400 }) * day);
    const status = purpose.mandatory
      ? "granted"
      : faker.helpers.weightedArrayElement([
          { weight: 70, value: "granted" as const },
          { weight: 15, value: "withdrawn" as const },
          { weight: 8, value: "denied" as const },
          { weight: 7, value: "expired" as const },
        ]);
    const version = faker.helpers.arrayElement(noticeVersions);
    const c: ConsentArtefact = {
      id: id("cns"),
      principalId: p.id,
      purpose,
      status,
      noticeVersion: version,
      noticeHash: hex64(),
      channel: faker.helpers.arrayElement(channels),
      grantedAt: status === "denied" ? null : grantedAt.toISOString(),
      validUntil: new Date(grantedAt.getTime() + purpose.retentionDays * day).toISOString(),
      updatedAt: grantedAt.toISOString(),
    };
    consents.push(c);
    appendLedger(p.tenantSlug, p.id, c, "requested", new Date(grantedAt.getTime() - 60_000).toISOString());
    appendLedger(p.tenantSlug, p.id, c, status === "denied" ? "denied" : "granted", grantedAt.toISOString());
    if (status === "withdrawn" || status === "expired") {
      const later = new Date(grantedAt.getTime() + faker.number.int({ min: 1, max: 4 }) * day).toISOString();
      c.updatedAt = later;
      appendLedger(p.tenantSlug, p.id, c, status, later);
    }
  }
}

export function newHash(): string {
  return hex64();
}
