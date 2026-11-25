import { z } from "zod";
import { Channel, Id, IsoDateTime } from "./common";

/** DPO-01 Overview contracts. All counts are tenant-scoped by the backend from the session. */

const Count = z.number().int().min(0);
const Pct = z.number().min(0).max(100);
/** In-app relative route only — never an external URL. */
export const AppLink = z.string().regex(/^\/[a-z0-9\-/?=&_]*$/);

export const OverviewMetrics = z.object({
  activeConsents: z.object({ value: Count, changePct30d: z.number().nullable() }),
  withdrawals7d: z.object({ value: Count, trendPct: z.number().nullable() }),
  optInRate: z.object({ value: Pct.nullable(), granted: Count, requested: Count }),
  openRightsRequests: z.object({ value: Count, dueWithin48h: Count }),
  openGrievances: z.object({ value: Count, nearCap: Count }),
  activeBreaches: z.object({ value: Count, oldestDeadlineAt: IsoDateTime.nullable() }),
});
export type OverviewMetrics = z.infer<typeof OverviewMetrics>;

export const TrendRange = z.enum(["30", "90"]);
export type TrendRange = z.infer<typeof TrendRange>;

export const ConsentTrendPoint = z.object({ date: z.iso.date(), granted: Count, withdrawn: Count });
export type ConsentTrendPoint = z.infer<typeof ConsentTrendPoint>;
export const ConsentTrend = z.object({ range: TrendRange, points: z.array(ConsentTrendPoint) });
export type ConsentTrend = z.infer<typeof ConsentTrend>;

export const PurposeBreakdown = z.object({
  purposeId: Id,
  purposeName: z.string(),
  granted: Count,
  withdrawn: Count,
  withdrawalRate: Pct,
});
export type PurposeBreakdown = z.infer<typeof PurposeBreakdown>;
export const PurposeBreakdownList = z.object({ items: z.array(PurposeBreakdown) });

export const ChannelBreakdown = z.object({ channel: Channel, count: Count });
export type ChannelBreakdown = z.infer<typeof ChannelBreakdown>;
export const ChannelBreakdownList = z.object({ items: z.array(ChannelBreakdown) });

export const AttentionType = z.enum([
  "dsr_sla",
  "grievance_cap",
  "breach_deadline",
  "webhook_failure",
  "notice_approval",
  "support_access",
  "pre_erasure",
  "consent_expiry",
]);
export type AttentionType = z.infer<typeof AttentionType>;
export const Severity = z.enum(["critical", "high", "medium", "low"]);
export type Severity = z.infer<typeof Severity>;

export const AttentionItem = z.object({
  id: Id,
  type: AttentionType,
  severity: Severity,
  dueAt: IsoDateTime.nullable(),
  link: AppLink,
  count: z.number().int().min(1),
});
export type AttentionItem = z.infer<typeof AttentionItem>;
export const AttentionList = z.object({ items: z.array(AttentionItem) });

export const SetupItemKey = z.enum([
  "purposes",
  "notice",
  "banner",
  "sdk",
  "webhooks",
  "dpoContact",
  "retention",
]);
export type SetupItemKey = z.infer<typeof SetupItemKey>;
export const SetupChecklist = z.object({
  score: Pct,
  items: z.array(z.object({ key: SetupItemKey, done: z.boolean(), link: AppLink })),
});
export type SetupChecklist = z.infer<typeof SetupChecklist>;

export const IntegrationHealth = z.object({
  sdk: z.array(z.object({ domain: z.string(), lastSeenAt: IsoDateTime.nullable() })),
  webhooks: z.object({ deliveries7d: Count, successRate7d: Pct.nullable() }),
  apiKeys: z.array(z.object({ id: Id, name: z.string(), lastUsedAt: IsoDateTime.nullable() })),
});
export type IntegrationHealth = z.infer<typeof IntegrationHealth>;

export const LanguageCoverage = z.object({
  items: z.array(z.object({ locale: z.string().min(2).max(8), label: z.string(), translatedPct: Pct })),
});
export type LanguageCoverage = z.infer<typeof LanguageCoverage>;

export const ActivityEvent = z.object({
  id: Id,
  at: IsoDateTime,
  actorName: z.string(),
  action: z.string(),
  target: z.string(),
});
export type ActivityEvent = z.infer<typeof ActivityEvent>;
export const ActivityList = z.object({ items: z.array(ActivityEvent) });
