"use client";

import type { ChannelBreakdown, ConsentTrend, PurposeBreakdown, TrendRange } from "@consent/schemas";
import { Skeleton, StatusBadge, cn } from "@consent/ui";
import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/format";
import { Block, type BlockView } from "./block";

// Dynamic import keeps Recharts out of the initial bundle.
const TrendChart = lazy(() => import("./charts-impl").then((m) => ({ default: m.TrendChart })));
const PurposeChart = lazy(() => import("./charts-impl").then((m) => ({ default: m.PurposeChart })));
const ChannelChart = lazy(() => import("./charts-impl").then((m) => ({ default: m.ChannelChart })));

const HIGH_WITHDRAWAL_PCT = 20;

function ChartFrame({ summary, children }: { summary: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <figure className="flex flex-col gap-3">
      {/* The chart is decorative for assistive tech; the caption carries the same information as text. */}
      <div role="img" aria-label={summary}>
        <Suspense fallback={<Skeleton className="h-56 w-full" aria-label={t("overview.chartLoading")} />}>
          {children}
        </Suspense>
      </div>
      <figcaption className="text-body-sm text-text-muted">{summary}</figcaption>
    </figure>
  );
}

export function ConsentTrendBlock({
  view,
  range,
  onRangeChange,
}: {
  view: BlockView<ConsentTrend>;
  range: TrendRange;
  onRangeChange: (r: TrendRange) => void;
}) {
  const { t } = useTranslation();
  const toggle = (
    <div role="group" aria-label={t("overview.trend.rangeLabel")} className="flex gap-1">
      {(["30", "90"] as const).map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={range === r}
          onClick={() => onRangeChange(r)}
          className={cn(
            "rounded-md border px-3 py-1 text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            range === r ? "border-primary bg-primary text-on-primary" : "border-border-strong text-primary hover:bg-surface-tint",
          )}
        >
          {t(r === "30" ? "overview.trend.range30" : "overview.trend.range90")}
        </button>
      ))}
    </div>
  );

  return (
    <Block
      id="overview-trend"
      title={t("overview.trend.title")}
      view={view}
      headerAction={toggle}
      isEmpty={(d) => d.points.every((p) => p.granted === 0 && p.withdrawn === 0)}
      emptyTitle={t("overview.trend.emptyTitle")}
      emptyBody={t("overview.trend.emptyBody")}
      skeleton={<Skeleton className="h-64 w-full" />}
    >
      {(d) => {
        const granted = d.points.reduce((s, p) => s + p.granted, 0);
        const withdrawn = d.points.reduce((s, p) => s + p.withdrawn, 0);
        return (
          <ChartFrame
            summary={t("overview.trend.summary", {
              days: d.range,
              granted: formatNumber(granted),
              withdrawn: formatNumber(withdrawn),
            })}
          >
            <TrendChart
              points={d.points}
              labels={{ granted: t("overview.trend.granted"), withdrawn: t("overview.trend.withdrawn") }}
            />
          </ChartFrame>
        );
      }}
    </Block>
  );
}

export function PurposeBlock({ view }: { view: BlockView<PurposeBreakdown[]> }) {
  const { t } = useTranslation();
  return (
    <Block
      id="overview-purposes"
      title={t("overview.purposes.title")}
      view={view}
      isEmpty={(d) => d.length === 0}
      emptyTitle={t("overview.purposes.emptyTitle")}
      emptyBody={t("overview.purposes.emptyBody")}
      skeleton={<Skeleton className="h-64 w-full" />}
    >
      {(items) => {
        const high = items.filter((p) => p.withdrawalRate > HIGH_WITHDRAWAL_PCT);
        return (
          <div className="flex flex-col gap-3">
            <ChartFrame summary={t("overview.purposes.summary", { count: items.length })}>
              <PurposeChart
                items={items}
                labels={{ granted: t("overview.purposes.granted"), withdrawn: t("overview.purposes.withdrawn") }}
              />
            </ChartFrame>
            {high.length === 0 ? (
              <p className="text-body-sm text-text-muted">{t("overview.purposes.noneHigh")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                <StatusBadge tone="danger" label={t("overview.purposes.highWithdrawal")} />
                <ul className="flex flex-col gap-1 text-body-sm">
                  {high.map((p) => (
                    <li key={p.purposeId}>
                      {p.purposeName}: {formatNumber(p.withdrawalRate)}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }}
    </Block>
  );
}

export function ChannelBlock({ view }: { view: BlockView<ChannelBreakdown[]> }) {
  const { t } = useTranslation();
  return (
    <Block
      id="overview-channels"
      title={t("overview.channels.title")}
      view={view}
      isEmpty={(d) => d.every((c) => c.count === 0)}
      emptyTitle={t("overview.channels.emptyTitle")}
      emptyBody={t("overview.channels.emptyBody")}
      skeleton={<Skeleton className="h-56 w-full" />}
    >
      {(items) => {
        const labelled = items.map((c) => ({ ...c, label: t(`overview.channels.${c.channel}`) }));
        const list = labelled.map((c) => `${c.label} ${formatNumber(c.count)}`).join(", ");
        return (
          <ChartFrame summary={t("overview.channels.summary", { list })}>
            <ChannelChart items={labelled} />
          </ChartFrame>
        );
      }}
    </Block>
  );
}
