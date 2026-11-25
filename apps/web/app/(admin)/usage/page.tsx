"use client";

import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Progress, QueryView, Stat, limitTone, useUsage } from "@/features/workspace";
import { formatDate, formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useUsage();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.platform.usage")} lead={t("screens.usage.lead")} featureIds="PLT-03" />
      <QueryView query={query}>
        {(u) => {
          const max = Math.max(1, ...u.daily.map((d) => d.consents));
          const pct = Math.min(100, Math.round((u.consents / u.consentLimit) * 100));
          return (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Stat
                  label={`${t("screens.usage.consents")} (${u.period})`}
                  tone={limitTone(pct)}
                  value={
                    <span className="flex flex-col gap-2">
                      <span>{formatNumber(u.consents)} <span className="text-body-sm text-text-muted">{t("screens.usage.limit", { limit: formatNumber(u.consentLimit) })} · {pct}%</span></span>
                      <Progress pct={pct} tone={limitTone(pct)} />
                    </span>
                  }
                />
                <Stat label={t("screens.usage.requests")} value={formatNumber(u.rightsRequests)} />
                <Stat label={t("screens.usage.api")} value={formatNumber(u.apiCalls)} />
                <Stat label={t("screens.usage.webhooks")} value={formatNumber(u.webhookDeliveries)} />
              </div>
              <Panel title={t("screens.usage.daily")}>
                <figure className="flex flex-col gap-2">
                  <div role="img" aria-label={t("screens.usage.daily")} className="flex h-48 items-end gap-1">
                    {u.daily.map((d) => (
                      <div key={d.date} title={`${formatDate(d.date)}: ${formatNumber(d.consents)}`} className="flex-1 rounded-t-sm bg-primary" style={{ height: `${(d.consents / max) * 100}%` }} />
                    ))}
                  </div>
                  <figcaption className="flex justify-between text-body-sm text-text-muted">
                    <span>{u.daily[0] ? formatDate(u.daily[0].date) : ""}</span>
                    <span>{u.daily.at(-1) ? formatDate(u.daily.at(-1)!.date) : ""}</span>
                  </figcaption>
                </figure>
              </Panel>
            </>
          );
        }}
      </QueryView>
    </div>
  );
}
