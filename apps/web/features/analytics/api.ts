"use client";

import {
  ActivityList,
  AttentionList,
  ChannelBreakdownList,
  ConsentTrend,
  IntegrationHealth,
  LanguageCoverage,
  OverviewMetrics,
  PurposeBreakdownList,
  SetupChecklist,
  type TrendRange,
} from "@consent/schemas";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { useTenant } from "@/lib/tenant/tenant-context";
import { overviewKeys } from "./keys";

export function useOverviewMetrics() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.metrics(slug),
    queryFn: ({ signal }) => request(OverviewMetrics, "/overview/metrics", { signal }),
  });
}

export function useConsentTrend(range: TrendRange) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.trend(slug, range),
    queryFn: ({ signal }) => request(ConsentTrend, `/overview/trend?range=${range}`, { signal }),
  });
}

export function usePurposeBreakdown() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.purposes(slug),
    queryFn: ({ signal }) => request(PurposeBreakdownList, "/overview/purposes", { signal }),
  });
}

export function useChannelBreakdown() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.channels(slug),
    queryFn: ({ signal }) => request(ChannelBreakdownList, "/overview/channels", { signal }),
  });
}

export function useAttention() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.attention(slug),
    queryFn: ({ signal }) => request(AttentionList, "/overview/attention", { signal }),
  });
}

export function useSetupChecklist(enabled: boolean) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.setup(slug),
    queryFn: ({ signal }) => request(SetupChecklist, "/overview/setup", { signal }),
    enabled,
  });
}

export function useIntegrationHealth(enabled: boolean) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.integrations(slug),
    queryFn: ({ signal }) => request(IntegrationHealth, "/overview/integrations", { signal }),
    enabled,
  });
}

export function useLanguageCoverage(enabled: boolean) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.languages(slug),
    queryFn: ({ signal }) => request(LanguageCoverage, "/overview/languages", { signal }),
    enabled,
  });
}

export function useRecentActivity() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: overviewKeys.activity(slug),
    queryFn: ({ signal }) => request(ActivityList, "/overview/activity", { signal }),
  });
}
