"use client";

import type { TrendRange } from "@consent/schemas";
import { StatusBadge } from "@consent/ui";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChannelBlock,
  ConsentTrendBlock,
  KpiCards,
  PurposeBlock,
  toView,
  useAttention,
  useChannelBreakdown,
  useConsentTrend,
  useOverviewMetrics,
  usePurposeBreakdown,
  useRecentActivity,
  visibleAttention,
} from "@/features/analytics";
import { PageHeader, Panel, Progress, QueryView, Stat, useDashboardExtras, useOnboarding } from "@/features/workspace";
import { useSession } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { roleHas } from "@/lib/permissions";

function mapView<T, U>(v: ReturnType<typeof toView<T>>, f: (d: T) => U): ReturnType<typeof toView<U>> {
  return v.status === "success" ? { status: "success", data: f(v.data) } : v;
}

export default function Page() {
  const { t } = useTranslation();
  const role = useSession().data?.activeRole ?? "viewer";
  const [range, setRange] = useState<TrendRange>("30");
  const metrics = useOverviewMetrics();
  const trend = useConsentTrend(range);
  const purposes = usePurposeBreakdown();
  const channels = useChannelBreakdown();
  const attention = useAttention();
  const activity = useRecentActivity();
  const extras = useDashboardExtras();
  const canSetup = roleHas(role, "config.manage");
  const onboarding = useOnboarding(canSetup);
  const setup = onboarding.data ? { done: onboarding.data.steps.filter((s) => s.done).length, total: onboarding.data.steps.length } : null;
  const sevTone = { critical: "danger", high: "danger", medium: "warning", low: "neutral" } as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.dashboard")} lead={t("overview.leadDpo")} featureIds="DPO-01" />
      {setup && setup.done < setup.total ? (
        <section aria-label={t("screens.dashboard.setupTitle")} className="flex flex-col gap-3 rounded-lg border border-warning bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-h4">{t("screens.dashboard.setupTitle")}</h2>
            <p className="text-body-sm text-text-muted">{t("screens.dashboard.setupBody", { done: setup.done, total: setup.total })}</p>
            <Progress pct={(setup.done / setup.total) * 100} tone="warning" className="max-w-xs" />
          </div>
          <Link href="/onboarding" className="shrink-0 rounded-md bg-primary px-4 py-2 text-center text-label text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-focus-ring">
            {t("screens.dashboard.setupOpen")}
          </Link>
        </section>
      ) : null}
      <KpiCards view={toView(metrics)} role={role} />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ConsentTrendBlock view={toView(trend)} range={range} onRangeChange={setRange} />
        </div>
        <Panel title={t("overview.attention.title")}>
          <QueryView query={attention} isEmpty={(d) => visibleAttention(d.items, role).length === 0}>
            {(d) => (
              <ul className="flex flex-col gap-3">
                {visibleAttention(d.items, role).map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 rounded-md border border-border p-3">
                    <StatusBadge tone={sevTone[a.severity]} label={t(`overview.attention.severity.${a.severity}`)} />
                    <Link href={a.link} className="text-body-sm text-primary underline-offset-2 hover:underline">
                      {t(`overview.attention.type.${a.type}`, { count: a.count })}
                    </Link>
                    {a.dueAt ? <span className="text-body-sm text-text-muted">{t("overview.attention.due", { date: formatDate(a.dueAt) })}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
      </div>
      <QueryView query={extras}>
        {(x) => (
          <div className="grid gap-5 xl:grid-cols-2">
            {roleHas(role, "dsr.work") ? (
              <Panel title={t("screens.dashboard.sla")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Stat label={t("screens.dashboard.onTrack")} value={x.sla.onTrack} tone="success" />
                  <Stat label={t("screens.dashboard.dueSoon")} value={x.sla.dueSoon} tone="warning" />
                  <Stat label={t("screens.dashboard.overdue")} value={x.sla.overdue} tone={x.sla.overdue > 0 ? "danger" : "neutral"} />
                </div>
                <Link href="/withdrawals" className="text-body-sm text-primary hover:underline">
                  {t("screens.dashboard.propagation", { count: x.propagationPending })}
                </Link>
              </Panel>
            ) : null}
            <Panel title={t("screens.dashboard.coverage")}>
              <ul className="flex flex-col gap-2">
                {x.noticeCoverage.map((v) => {
                  const total = x.noticeCoverage.reduce((s, c) => s + c.consents, 0) || 1;
                  const pct = Math.round((v.consents / total) * 100);
                  return (
                    <li key={v.version} className="flex items-center gap-3 text-body-sm">
                      <span className="w-12 font-semibold">{v.version}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-tint" aria-hidden>
                        <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-28 text-right text-text-muted">{formatNumber(v.consents)} · {pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        )}
      </QueryView>
      <div className="grid gap-5 xl:grid-cols-2">
        <PurposeBlock view={mapView(toView(purposes), (d) => d.items)} />
        <ChannelBlock view={mapView(toView(channels), (d) => d.items)} />
      </div>
      <Panel title={t("overview.activity.title")}>
        <QueryView query={activity} isEmpty={(d) => d.items.length === 0}>
          {(d) => (
            <ul className="flex flex-col divide-y divide-border">
              {d.items.slice(0, 10).map((e) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2 py-2 text-body-sm">
                  <span>{t("overview.activity.item", { actor: e.actorName, action: e.action, target: e.target })}</span>
                  <span className="text-text-muted">{formatDateTime(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </Panel>
    </div>
  );
}
