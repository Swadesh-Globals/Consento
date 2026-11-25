import { z } from "zod";
import { Id, IsoDateTime } from "./common";

/** P0 contracts for the extended DPDP programme screens (PRD §3, features added Nov 2026). */

const Pct = z.number().min(0).max(100);
const Count = z.number().int().min(0);
export const TimelineItem = z.object({ at: IsoDateTime, actor: z.string(), note: z.string() });

// DPO-01 extras
export const DashboardExtras = z.object({
  sla: z.object({ onTrack: Count, dueSoon: Count, overdue: Count }),
  noticeCoverage: z.array(z.object({ version: z.string(), consents: Count })),
  propagationPending: Count,
});
export type DashboardExtras = z.infer<typeof DashboardExtras>;

// DPO-03 response templates
export const ResponseTemplate = z.object({ id: Id, requestType: z.string(), name: z.string(), body: z.string() });
export const ResponseTemplateList = z.object({ items: z.array(ResponseTemplate) });

// DPO-11 withdrawal propagation
export const PropagationTarget = z.object({
  name: z.string(),
  kind: z.enum(["system", "processor"]),
  status: z.enum(["confirmed", "pending", "failed"]),
  ackAt: IsoDateTime.nullable(),
});
export const WithdrawalPropagation = z.object({
  id: Id,
  maskedContact: z.string(),
  purposeName: z.string(),
  withdrawnAt: IsoDateTime,
  targets: z.array(PropagationTarget),
});
export type WithdrawalPropagation = z.infer<typeof WithdrawalPropagation>;
export const WithdrawalPropagationList = z.object({ items: z.array(WithdrawalPropagation) });

// DPO-12 guardian consent
export const GuardianConsent = z.object({
  id: Id,
  kind: z.enum(["child", "disability"]),
  principalMasked: z.string(),
  guardianMasked: z.string(),
  ageGate: z.enum(["under_18", "adult", "not_applicable"]),
  method: z.enum(["digilocker_token", "existing_adult_account", "id_document", "court_order"]),
  purposeName: z.string(),
  status: z.enum(["pending", "verified", "rejected"]),
  submittedAt: IsoDateTime,
});
export type GuardianConsent = z.infer<typeof GuardianConsent>;
export const GuardianConsentList = z.object({ items: z.array(GuardianConsent) });
export const GuardianDecision = z.object({ status: z.enum(["verified", "rejected"]) });

// DPO-13 erasure scheduler
export const ErasureItem = z.object({
  id: Id,
  maskedContact: z.string(),
  purposeName: z.string(),
  ruleClass: z.string(),
  scheduledAt: IsoDateTime,
  noticeSentAt: IsoDateTime.nullable(),
  status: z.enum(["notice_pending", "notice_sent", "erased", "held"]),
  certificateId: z.string().nullable(),
});
export type ErasureItem = z.infer<typeof ErasureItem>;
export const ErasureList = z.object({ items: z.array(ErasureItem) });

// CFG-08 legitimate uses
export const LegitimateUse = z.object({
  id: Id,
  name: z.string(),
  section: z.string(),
  justification: z.string(),
  dataCategories: z.array(z.string()),
  systems: z.array(z.string()),
  owner: z.string(),
  reviewedAt: IsoDateTime,
});
export const LegitimateUseList = z.object({ items: z.array(LegitimateUse) });

// DPO-15 reports + ENG-08 ledger verification
export const ReportDefinition = z.object({ id: Id, name: z.string(), description: z.string(), formats: z.array(z.enum(["PDF", "CSV"])), lastRunAt: IsoDateTime.nullable() });
export const ReportList = z.object({ items: z.array(ReportDefinition) });
export const LedgerVerification = z.object({
  verified: z.boolean(),
  entries: Count,
  headHash: z.string(),
  lastAnchorAt: IsoDateTime,
  anchorObject: z.string(),
  checkedAt: IsoDateTime,
});
export type LedgerVerification = z.infer<typeof LedgerVerification>;

// DPO-09 DPIA and audit
export const Assessment = z.object({
  id: Id,
  title: z.string(),
  kind: z.enum(["dpia", "annual_audit"]),
  status: z.enum(["planned", "in_progress", "completed"]),
  owner: z.string(),
  dueAt: IsoDateTime,
  evidenceLinked: Count,
  openFindings: Count,
});
export const AssessmentList = z.object({ items: z.array(Assessment) });

// CFG-16 processors
export const Processor = z.object({
  id: Id,
  name: z.string(),
  service: z.string(),
  purposes: z.array(z.string()),
  dpaStatus: z.enum(["signed", "pending", "expired"]),
  dpaExpiresAt: IsoDateTime.nullable(),
  region: z.string(),
  instructionsPending: Count,
  lastInstructionAt: IsoDateTime.nullable(),
});
export const ProcessorList = z.object({ items: z.array(Processor) });

// CFG-17 data inventory
export const InventoryItem = z.object({
  id: Id,
  purposeName: z.string(),
  dataCategories: z.array(z.string()),
  systems: z.array(z.string()),
  retentionDays: z.number().int().min(1),
  source: z.enum(["manual", "discovery"]),
});
export const InventoryList = z.object({ items: z.array(InventoryItem) });

// CFG-02 / COL-09 notice diff + re-consent
export const NoticeDiff = z.object({
  from: z.string(),
  to: z.string(),
  lines: z.array(z.object({ op: z.enum(["add", "remove", "same"]), text: z.string() })),
  reconsent: z.object({ targeted: Count, reconsented: Count, pending: Count, campaignStatus: z.enum(["not_started", "running", "completed"]) }),
});
export type NoticeDiff = z.infer<typeof NoticeDiff>;

// CFG-11 language packs
const ApprovalStatus = z.enum(["approved", "in_review", "draft", "missing"]);
export const LanguagePack = z.object({
  code: z.string(),
  name: z.string(),
  dir: z.enum(["ltr", "rtl"]),
  notice: ApprovalStatus,
  banner: ApprovalStatus,
  privacyPolicy: ApprovalStatus,
  translatedPct: Pct,
  reviewer: z.string().nullable(),
});
export type LanguagePack = z.infer<typeof LanguagePack>;
/** Principal-facing content for one language: banner copy, notice text and the privacy policy. */
export const LanguageContent = z.object({
  code: z.string(),
  name: z.string(),
  dir: z.enum(["ltr", "rtl"]),
  banner: z.object({ title: z.string().max(80), body: z.string().max(400), acceptLabel: z.string().max(40), rejectLabel: z.string().max(40), customiseLabel: z.string().max(40) }),
  notice: z.string().max(4000),
  privacyPolicy: z.string().max(20000),
  updatedAt: IsoDateTime.nullable(),
});
export type LanguageContent = z.infer<typeof LanguageContent>;
export const PrivacyPolicyUpdate = z.object({ privacyPolicy: z.string().min(1).max(20000) });
export const LanguagePackList = z.object({ items: z.array(LanguagePack) });

// CFG-18 collection channels
export const CollectionChannel = z.object({
  key: z.enum(["web", "app", "call_centre", "kiosk", "paper"]),
  enabled: z.boolean(),
  consents30d: Count,
  attestationRequired: z.boolean(),
  lastCaptureAt: IsoDateTime.nullable(),
});
export const CollectionChannelList = z.object({ items: z.array(CollectionChannel) });

// CFG-19 verification settings
export const VerificationSetting = z.object({
  requestType: z.string(),
  method: z.enum(["otp_sms", "otp_email", "kyc", "account_login"]),
  strength: z.enum(["low", "medium", "high"]),
  reverifyDays: Count,
});
export const VerificationSettingList = z.object({ items: z.array(VerificationSetting) });

// CFG-20 SLA and workflow rules
export const WorkflowRule = z.object({
  requestType: z.string(),
  slaDays: z.number().int().min(1),
  approver: z.string(),
  autoAssign: z.enum(["round_robin", "least_loaded", "manual"]),
  escalateAfterDays: z.number().int().min(1),
  escalateTo: z.string(),
});
export const WorkflowRuleList = z.object({ items: z.array(WorkflowRule) });

// CFG-21 branding
export const Branding = z.object({
  displayName: z.string(),
  logoFile: z.string(),
  primaryColour: z.string(),
  customDomain: z.string(),
  domainStatus: z.enum(["verified", "pending_dns", "not_set"]),
  emailSender: z.string(),
  senderVerified: z.boolean(),
});
export type Branding = z.infer<typeof Branding>;

// CFG-13 SSO / SCIM
export const SsoConfig = z.object({
  protocol: z.enum(["saml", "oidc"]),
  idp: z.string(),
  status: z.enum(["active", "testing", "not_configured"]),
  enforced: z.boolean(),
  scim: z.object({ enabled: z.boolean(), lastSyncAt: IsoDateTime.nullable(), usersProvisioned: Count, groupsMapped: Count }),
});
export type SsoConfig = z.infer<typeof SsoConfig>;

// CFG-22 log retention
export const LogRetention = z.object({
  minimumDays: z.number().int(),
  items: z.array(z.object({ logType: z.string(), retentionDays: z.number().int().min(365), region: z.string(), immutable: z.boolean() })),
});
export type LogRetention = z.infer<typeof LogRetention>;

// INT-06 Consent Manager interoperability
export const InteropOverview = z.object({
  apiVersion: z.string(),
  endpoints: z.array(z.object({ method: z.string(), path: z.string(), description: z.string(), status: z.enum(["draft", "available"]) })),
  consentManagers: z.array(z.object({ name: z.string(), status: z.enum(["connected", "testing", "not_connected"]) })),
});
export type InteropOverview = z.infer<typeof InteropOverview>;

// PLT-01 notifications
export const NotificationItem = z.object({
  id: Id,
  channel: z.enum(["email", "sms", "in_app"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  link: z.string(),
  at: IsoDateTime,
  read: z.boolean(),
});
export const NotificationList = z.object({ items: z.array(NotificationItem) });

// PLT-02 sandbox
export const Sandbox = z.object({
  enabled: z.boolean(),
  slug: z.string(),
  createdAt: IsoDateTime.nullable(),
  seededPrincipals: Count,
  apiKeyPrefix: z.string().nullable(),
  lastResetAt: IsoDateTime.nullable(),
  liveSince: IsoDateTime.nullable(),
});
export type Sandbox = z.infer<typeof Sandbox>;

// PLT-03 usage metering
export const Usage = z.object({
  period: z.string(),
  consents: Count,
  consentLimit: Count,
  rightsRequests: Count,
  apiCalls: Count,
  webhookDeliveries: Count,
  daily: z.array(z.object({ date: z.iso.date(), consents: Count, apiCalls: Count })),
});
export type Usage = z.infer<typeof Usage>;
