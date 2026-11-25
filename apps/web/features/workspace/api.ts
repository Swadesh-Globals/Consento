"use client";

import {
  AssessmentList,
  Branding,
  CollectionChannelList,
  DashboardExtras,
  ErasureList,
  GuardianConsentList,
  InteropOverview,
  InventoryList,
  LanguageContent,
  LanguagePackList,
  LedgerVerification,
  LegitimateUseList,
  LogRetention,
  NoticeDiff,
  NotificationList,
  ProcessorList,
  ReportList,
  ResponseTemplateList,
  Sandbox,
  SsoConfig,
  Usage,
  VerificationSettingList,
  WithdrawalPropagationList,
  WorkflowRuleList,
  ApiKeyList,
  AuditLogList,
  AuditPack,
  AuditPackList,
  BannerConfig,
  Breach,
  BreachList,
  Dsr,
  DsrList,
  Grievance,
  GrievanceList,
  NoticeList,
  Onboarding,
  PrincipalDetail,
  PrincipalList,
  PurposeRowList,
  RetentionRuleList,
  StaffUserList,
  SupportRequestList,
  WebhookDelivery,
  WebhookOverview,
} from "@consent/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { request } from "@/lib/api-client";
import { useTenant } from "@/lib/tenant/tenant-context";

/** Tenant-scoped keys so cached data never leaks across tenants (frontend.md §5). */
const key = (t: string, ...parts: string[]) => ["tenant", t, ...parts] as const;

function useList<S extends z.ZodType>(schema: S, area: string, path: string, enabled = true) {
  const { slug } = useTenant();
  return useQuery({ queryKey: key(slug, area, path), queryFn: ({ signal }) => request(schema, path, { signal }), enabled });
}

function useAction<S extends z.ZodType, V>(schema: S, areas: string[], build: (v: V) => { path: string; method: "POST" | "PATCH" | "PUT"; body?: unknown }) {
  const { slug } = useTenant();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: V) => {
      const { path, method, body } = build(v);
      return request(schema, path, { method, body });
    },
    onSuccess: () => {
      for (const a of [...areas, "overview", "audit-log"]) void qc.invalidateQueries({ queryKey: key(slug, a) });
    },
  });
}

export const usePrincipals = (q: string) => useList(PrincipalList, "principals", `/principals?q=${encodeURIComponent(q)}`);
export const usePrincipal = (id: string | null) => useList(PrincipalDetail, "principals", `/principals/${id ?? ""}`, !!id);

export const useDsrs = () => useList(DsrList, "dsr", "/dsr");
export const useUpdateDsr = () =>
  useAction(Dsr, ["dsr"], (v: { id: string; status: Dsr["status"] }) => ({ path: `/dsr/${v.id}`, method: "PATCH", body: { status: v.status } }));

export const useGrievances = () => useList(GrievanceList, "grievances", "/grievances");
export const useUpdateGrievance = () =>
  useAction(Grievance, ["grievances"], (v: { id: string; status: Grievance["status"]; closureNote?: string }) => ({
    path: `/grievances/${v.id}`,
    method: "PATCH",
    body: { status: v.status, closureNote: v.closureNote },
  }));

export const useBreaches = () => useList(BreachList, "breaches", "/breaches");
export const useNotifyBreach = () => useAction(Breach, ["breaches"], (id: string) => ({ path: `/breaches/${id}/notify`, method: "POST" }));

export const useAuditPacks = () => useList(AuditPackList, "audit-packs", "/audit-packs");
export const useCreateAuditPack = () => useAction(AuditPack, ["audit-packs"], (period: string) => ({ path: "/audit-packs", method: "POST", body: { period } }));

export const useOnboarding = (enabled = true) => useList(Onboarding, "onboarding", "/onboarding", enabled);
export const usePurposes = () => useList(PurposeRowList, "purposes", "/purposes");

export const useNotices = () => useList(NoticeList, "notices", "/notices");
export const usePublishNotice = () => useAction(NoticeList, ["notices"], (id: string) => ({ path: `/notices/${id}/publish`, method: "POST" }));

export const useBanner = () => useList(BannerConfig, "banner", "/banner");
export const useSaveBanner = () => useAction(BannerConfig, ["banner"], (b: BannerConfig) => ({ path: "/banner", method: "PUT", body: b }));

export const useRetention = () => useList(RetentionRuleList, "retention", "/retention");
export const useUsers = () => useList(StaffUserList, "users", "/users");
export const useApiKeys = () => useList(ApiKeyList, "api-keys", "/api-keys");

export const useWebhooks = () => useList(WebhookOverview, "webhooks", "/webhooks");
export const useReplayDelivery = () => useAction(WebhookDelivery, ["webhooks"], (id: string) => ({ path: `/webhooks/deliveries/${id}/replay`, method: "POST" }));

export const useSupportRequests = () => useList(SupportRequestList, "support-access", "/support-access");
export const useDecideSupport = () =>
  useAction(SupportRequestList, ["support-access"], (v: { id: string; decision: "approved" | "denied" }) => ({
    path: `/support-access/${v.id}/decision`,
    method: "POST",
    body: { decision: v.decision },
  }));

export const useAuditLog = () => useList(AuditLogList, "audit-log", "/audit-log");

// Extended programme screens
export const useDashboardExtras = () => useList(DashboardExtras, "overview", "/overview/extras");
export const useResponseTemplates = () => useList(ResponseTemplateList, "dsr", "/dsr/templates");
export const useWithdrawals = () => useList(WithdrawalPropagationList, "withdrawals", "/withdrawals");
export const useRetryWithdrawal = () => useAction(WithdrawalPropagationList, ["withdrawals"], (id: string) => ({ path: `/withdrawals/${id}/retry`, method: "POST" }));
export const useGuardianConsents = () => useList(GuardianConsentList, "guardian", "/guardian-consents");
export const useDecideGuardian = () =>
  useAction(GuardianConsentList, ["guardian"], (v: { id: string; status: "verified" | "rejected" }) => ({ path: `/guardian-consents/${v.id}/decision`, method: "POST", body: { status: v.status } }));
export const useErasures = () => useList(ErasureList, "erasure", "/erasures");
export const useToggleErasureHold = () => useAction(ErasureList, ["erasure"], (id: string) => ({ path: `/erasures/${id}/hold`, method: "POST" }));
export const useLegitimateUses = () => useList(LegitimateUseList, "legitimate-uses", "/legitimate-uses");
export const useReports = () => useList(ReportList, "reports", "/reports");
export const useLedgerVerification = () => useList(LedgerVerification, "reports", "/ledger/verify");
export const useAssessments = () => useList(AssessmentList, "dpia", "/assessments");
export const useProcessors = () => useList(ProcessorList, "processors", "/processors");
export const useInventory = () => useList(InventoryList, "inventory", "/inventory");
export const useNoticeDiff = (id: string | null) => useList(NoticeDiff, "notices", `/notices/${id ?? ""}/diff`, !!id);
export const useLanguagePacks = () => useList(LanguagePackList, "languages", "/language-packs");
export const useLanguageContent = (code: string | null) => useList(LanguageContent, "languages", `/language-packs/${code ?? ""}`, code !== null);
export const useSavePrivacyPolicy = () =>
  useAction(LanguageContent, ["languages"], ({ code, privacyPolicy }: { code: string; privacyPolicy: string }) => ({
    path: `/language-packs/${code}/privacy-policy`,
    method: "PUT",
    body: { privacyPolicy },
  }));
export const useChannels = () => useList(CollectionChannelList, "channels", "/channels");
export const useVerificationSettings = () => useList(VerificationSettingList, "verification", "/verification-settings");
export const useWorkflowRules = () => useList(WorkflowRuleList, "workflows", "/workflow-rules");
export const useBranding = () => useList(Branding, "branding", "/branding");
export const useSso = () => useList(SsoConfig, "sso", "/sso");
export const useLogRetention = () => useList(LogRetention, "log-retention", "/log-retention");
export const useInterop = () => useList(InteropOverview, "interop", "/interop");
export const useNotifications = () => useList(NotificationList, "notifications", "/notifications");
export const useMarkAllRead = () => useAction(NotificationList, ["notifications"], (_: void) => ({ path: "/notifications/read-all", method: "POST" }));
export const useSandbox = () => useList(Sandbox, "sandbox", "/sandbox");
export const useResetSandbox = () => useAction(Sandbox, ["sandbox"], (_: void) => ({ path: "/sandbox/reset", method: "POST" }));
export const useUsage = () => useList(Usage, "usage", "/usage");
