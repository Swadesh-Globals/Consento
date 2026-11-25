import { z } from "zod";
import { Channel, Id, IsoDateTime } from "./common";
import { Purpose } from "./catalogue";
import { ConsentArtefact, LedgerEntry } from "./consent";
import { StaffRole } from "./identity";

/** P0 screen contracts (PRD §4.1). Shapes become OpenAPI v0 for P1. */

// DPO-02 consent lookup
export const PrincipalSummary = z.object({
  id: Id,
  maskedContact: z.string(),
  activeConsents: z.number().int().min(0),
  withdrawnConsents: z.number().int().min(0),
  lastActivityAt: IsoDateTime,
});
export type PrincipalSummary = z.infer<typeof PrincipalSummary>;
export const PrincipalList = z.object({ items: z.array(PrincipalSummary), total: z.number().int().min(0) });
export const PrincipalDetail = z.object({
  principal: PrincipalSummary,
  consents: z.array(ConsentArtefact),
  ledger: z.array(LedgerEntry),
  chainVerified: z.boolean(),
});
export type PrincipalDetail = z.infer<typeof PrincipalDetail>;

const TimelineEntry = z.object({ at: IsoDateTime, actor: z.string(), note: z.string() });

// DPO-03 / DPO-04 rights requests
export const DsrType = z.enum(["access", "correction", "completion", "erasure", "nomination"]);
export const DsrStatus = z.enum(["submitted", "in_progress", "completed", "rejected"]);
export const Dsr = z.object({
  id: Id,
  type: DsrType,
  status: DsrStatus,
  maskedContact: z.string(),
  channel: Channel,
  identityVerified: z.boolean(),
  assignee: z.string().nullable(),
  submittedAt: IsoDateTime,
  dueAt: IsoDateTime,
  timeline: z.array(TimelineEntry),
});
export type Dsr = z.infer<typeof Dsr>;
export const DsrList = z.object({ items: z.array(Dsr) });
export const DsrUpdate = z.object({ status: DsrStatus });

// DPO-05 grievances
export const GrievanceStatus = z.enum(["open", "escalated", "resolved"]);
export const Grievance = z.object({
  id: Id,
  subject: z.string(),
  category: z.enum(["consent_withdrawal", "data_accuracy", "notice_clarity", "rights_delay", "other"]),
  status: GrievanceStatus,
  maskedContact: z.string(),
  assignee: z.string().nullable(),
  openedAt: IsoDateTime,
  dueAt: IsoDateTime,
  /** Closure evidence kept for any Board inquiry (DPO-05). */
  closureNote: z.string().nullable(),
  evidence: z.array(z.string()),
});
export type Grievance = z.infer<typeof Grievance>;
export const GrievanceList = z.object({ items: z.array(Grievance) });
export const GrievanceUpdate = z.object({ status: GrievanceStatus, closureNote: z.string().max(1000).optional() });

// DPO-06 breaches
export const BreachSeverity = z.enum(["critical", "high", "medium", "low"]);
export const Breach = z.object({
  id: Id,
  title: z.string(),
  severity: BreachSeverity,
  status: z.enum(["open", "notified", "closed"]),
  detectedAt: IsoDateTime,
  boardDeadlineAt: IsoDateTime,
  principalsAffected: z.number().int().min(0),
  dataCategories: z.array(z.string()),
  boardNotifiedAt: IsoDateTime.nullable(),
  principalsNotifiedAt: IsoDateTime.nullable(),
  /** Incident timeline (DPO-06). */
  timeline: z.array(TimelineEntry),
  principalNoticeDraft: z.string(),
});
export type Breach = z.infer<typeof Breach>;
export const BreachList = z.object({ items: z.array(Breach) });

// DPO-07 audit packs
export const AuditPack = z.object({
  id: Id,
  period: z.string(),
  requestedBy: z.string(),
  createdAt: IsoDateTime,
  status: z.enum(["generating", "ready"]),
  sizeKb: z.number().int().min(0),
  sections: z.array(z.string()),
});
export type AuditPack = z.infer<typeof AuditPack>;
export const AuditPackList = z.object({ items: z.array(AuditPack) });
export const AuditPackCreate = z.object({ period: z.string().min(1).max(40) });

// CFG onboarding
export const OnboardingStep = z.object({ key: z.string(), done: z.boolean(), link: z.string() });
export const Onboarding = z.object({
  organisation: z.object({ name: z.string(), dpoEmail: z.string(), sector: z.string(), region: z.string() }),
  steps: z.array(OnboardingStep),
});
export type Onboarding = z.infer<typeof Onboarding>;

// CFG purposes
export const PurposeRow = Purpose.extend({ activeConsents: z.number().int().min(0), status: z.enum(["active", "draft"]) });
export type PurposeRow = z.infer<typeof PurposeRow>;
export const PurposeRowList = z.object({ items: z.array(PurposeRow) });

// CFG notices
export const Notice = z.object({
  id: Id,
  title: z.string(),
  version: z.string(),
  status: z.enum(["draft", "pending_approval", "published"]),
  languages: z.object({ en: z.boolean(), hi: z.boolean(), kn: z.boolean() }),
  purposeCount: z.number().int().min(0),
  updatedAt: IsoDateTime,
  author: z.string(),
  versions: z.array(z.object({ version: z.string(), publishedAt: IsoDateTime, hash: z.string() })),
});
export type Notice = z.infer<typeof Notice>;
export const NoticeList = z.object({ items: z.array(Notice) });

// CFG banner
export const BannerConfig = z.object({
  layout: z.enum(["bar", "box", "modal"]),
  position: z.enum(["bottom", "top", "center"]),
  title: z.string(),
  body: z.string(),
  acceptLabel: z.string(),
  rejectLabel: z.string(),
  customiseLabel: z.string(),
  languages: z.array(z.string()),
  impressions7d: z.number().int().min(0),
  acceptRate7d: z.number().min(0).max(100),
});
export type BannerConfig = z.infer<typeof BannerConfig>;

// CFG retention
export const RetentionRule = z.object({
  id: Id,
  purposeName: z.string(),
  retentionDays: z.number().int().min(1),
  action: z.enum(["delete", "anonymise"]),
  trigger: z.enum(["consent_withdrawn", "purpose_complete", "consent_expired"]),
  nextRunAt: IsoDateTime,
  pendingErasures: z.number().int().min(0),
});
export type RetentionRule = z.infer<typeof RetentionRule>;
export const RetentionRuleList = z.object({ items: z.array(RetentionRule) });

// CFG users
export const StaffUser = z.object({
  id: Id,
  name: z.string(),
  email: z.string(),
  role: StaffRole,
  status: z.enum(["active", "invited", "suspended"]),
  mfa: z.boolean(),
  lastActiveAt: IsoDateTime.nullable(),
});
export type StaffUser = z.infer<typeof StaffUser>;
export const StaffUserList = z.object({ items: z.array(StaffUser) });

// CFG API keys
export const ApiKey = z.object({
  id: Id,
  name: z.string(),
  prefix: z.string(),
  scopes: z.array(z.string()),
  status: z.enum(["active", "revoked"]),
  createdAt: IsoDateTime,
  lastUsedAt: IsoDateTime.nullable(),
});
export type ApiKey = z.infer<typeof ApiKey>;
export const ApiKeyList = z.object({ items: z.array(ApiKey) });

// CFG webhooks
export const WebhookEndpoint = z.object({
  id: Id,
  url: z.string(),
  events: z.array(z.string()),
  status: z.enum(["active", "paused"]),
  successRate7d: z.number().min(0).max(100).nullable(),
  lastDeliveryAt: IsoDateTime.nullable(),
});
export type WebhookEndpoint = z.infer<typeof WebhookEndpoint>;
export const WebhookDelivery = z.object({
  id: Id,
  endpointId: Id,
  event: z.string(),
  at: IsoDateTime,
  httpStatus: z.number().int(),
  ok: z.boolean(),
  attempts: z.number().int().min(1),
});
export type WebhookDelivery = z.infer<typeof WebhookDelivery>;
export const WebhookOverview = z.object({ endpoints: z.array(WebhookEndpoint), deliveries: z.array(WebhookDelivery) });
export type WebhookOverview = z.infer<typeof WebhookOverview>;

// CFG support access
export const SupportRequest = z.object({
  id: Id,
  requestedBy: z.string(),
  reason: z.string(),
  scope: z.string(),
  durationHours: z.number().int().min(1),
  status: z.enum(["pending", "approved", "denied"]),
  requestedAt: IsoDateTime,
  expiresAt: IsoDateTime.nullable(),
});
export type SupportRequest = z.infer<typeof SupportRequest>;
export const SupportRequestList = z.object({ items: z.array(SupportRequest) });
export const SupportDecision = z.object({ decision: z.enum(["approved", "denied"]) });

// CFG audit log
export const AuditLogEvent = z.object({
  id: Id,
  at: IsoDateTime,
  actorName: z.string(),
  action: z.string(),
  target: z.string(),
  ip: z.string(),
});
export type AuditLogEvent = z.infer<typeof AuditLogEvent>;
export const AuditLogList = z.object({ items: z.array(AuditLogEvent) });
