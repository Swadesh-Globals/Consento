"use client";

import type { OverviewMetrics, StaffRole } from "@consent/schemas";
import { Skeleton, cn } from "@consent/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/format";
import { roleHas, type Permission } from "@/lib/permissions";
import { Block, type BlockView } from "./block";

interface Kpi {
  key: string;
  label: string;
  value: string;
  detail: ReactNode;
  href: string;
  permission: Permission;
}

/** Trend delta. `upIsGood=false` for metrics where a rise is bad (withdrawals, overdue). Words + arrow; colour only reinforces. */
function Change({ pct, suffix, upIsGood = true }: { pct: number | null; suffix: string; upIsGood?: boolean }) {
  const { t } = useTranslation();
  if (pct === null) return <>{t("overview.kpi.noComparison")}</>;
  // Direction is spelled out in words and an arrow, never colour alone.
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "■";
  const good = pct === 0 ? null : pct > 0 === upIsGood;
  const colour = good === null ? "text-text-muted" : good ? "text-success" : "text-danger";
  const words =
    pct > 0
      ? t("overview.kpi.up", { value: formatNumber(pct) })
      : pct < 0
        ? t("overview.kpi.down", { value: formatNumber(Math.abs(pct)) })
        : t("overview.kpi.flat");
  return (
    <span className={colour}>
      <span aria-hidden>{arrow} </span>
      {words} {suffix}
    </span>
  );
}

export function formatCountdown(deadlineIso: string, nowMs: number): string | null {
  const left = Date.parse(deadlineIso) - nowMs;
  if (left <= 0) return null;
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  return `${h} h ${m} min`;
}

export function KpiCards({
  view,
  role,
  nowMs = Date.now(),
}: {
  view: BlockView<OverviewMetrics>;
  role: StaffRole;
  nowMs?: number;
}) {
  const { t } = useTranslation();

  const build = (m: OverviewMetrics): Kpi[] => {
    const countdown = m.activeBreaches.oldestDeadlineAt
      ? formatCountdown(m.activeBreaches.oldestDeadlineAt, nowMs)
      : null;
    return [
      {
        key: "activeConsents",
        label: t("overview.kpi.activeConsents"),
        value: formatNumber(m.activeConsents.value),
        detail: <Change pct={m.activeConsents.changePct30d} suffix={t("overview.kpi.vs30d")} />,
        href: "/principals",
        permission: "principal.lookup",
      },
      {
        key: "withdrawals7d",
        label: t("overview.kpi.withdrawals7d"),
        value: formatNumber(m.withdrawals7d.value),
        detail: <Change pct={m.withdrawals7d.trendPct} suffix={t("overview.kpi.vsPrev7d")} upIsGood={false} />,
        href: "/principals",
        permission: "principal.lookup",
      },
      {
        key: "optInRate",
        label: t("overview.kpi.optInRate"),
        value: m.optInRate.value === null ? t("overview.kpi.notAvailable") : `${formatNumber(m.optInRate.value)}%`,
        detail: t("overview.kpi.optInDetail", {
          granted: formatNumber(m.optInRate.granted),
          requested: formatNumber(m.optInRate.requested),
        }),
        href: "/principals",
        permission: "principal.lookup",
      },
      {
        key: "openDsr",
        label: t("overview.kpi.openDsr"),
        value: formatNumber(m.openRightsRequests.value),
        detail: t("overview.kpi.due48h", { count: m.openRightsRequests.dueWithin48h }),
        href: "/dsr",
        permission: "dsr.work",
      },
      {
        key: "openGrievances",
        label: t("overview.kpi.openGrievances"),
        value: formatNumber(m.openGrievances.value),
        detail: t("overview.kpi.nearCap", { count: m.openGrievances.nearCap }),
        href: "/grievances-queue",
        permission: "grievance.work",
      },
      {
        key: "activeBreaches",
        label: t("overview.kpi.activeBreaches"),
        value: formatNumber(m.activeBreaches.value),
        detail:
          m.activeBreaches.value === 0
            ? t("overview.kpi.noBreaches")
            : countdown
              ? t("overview.kpi.breachLeft", { time: countdown })
              : t("overview.kpi.breachOverdue"),
        href: "/breaches",
        permission: "breach.manage",
      },
    ];
  };

  return (
    <Block
      id="overview-kpis"
      title={t("overview.kpi.title")}
      view={view}
      isEmpty={() => false}
      emptyTitle=""
      emptyBody=""
      skeleton={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      }
    >
      {(m) => (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {build(m).map((k) => {
            const content = (
              <>
                <span className="text-label text-text-muted">{k.label}</span>
                <span className="text-h3 text-primary">{k.value}</span>
                <span className="text-body-sm text-text-muted">{k.detail}</span>
              </>
            );
            const box = "flex h-full flex-col gap-1 rounded-md border border-border p-4";
            return (
              <li key={k.key} data-testid={`kpi-${k.key}`}>
                {roleHas(role, k.permission) ? (
                  <Link
                    href={k.href}
                    className={cn(
                      box,
                      "transition-colors hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={box}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Block>
  );
}
