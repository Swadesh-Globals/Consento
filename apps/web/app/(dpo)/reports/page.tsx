"use client";

import { Button, Card, StatusBadge } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, QueryView, Stat, useLedgerVerification, useReports } from "@/features/workspace";
import { formatDateTime, formatNumber, shortHash } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const reports = useReports();
  const ledger = useLedgerVerification();
  const [queued, setQueued] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.reports")} lead={t("screens.reports.lead")} featureIds="DPO-15 · ENG-08" />
      <Panel title={t("screens.reports.ledger")}>
        <QueryView query={ledger}>
          {(l) => (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={l.verified ? "success" : "danger"} label={t(l.verified ? "screens.reports.verified" : "screens.reports.broken")} />
                <Button size="sm" variant="ghost" disabled={ledger.isFetching} onClick={() => void ledger.refetch()}>{t("screens.reports.verify")}</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Stat label={t("screens.reports.entries")} value={formatNumber(l.entries)} />
                <Stat label={t("screens.reports.head")} value={<code className="text-body-sm">{shortHash(l.headHash)}</code>} />
                <Stat label={t("screens.reports.anchor")} value={<span className="text-body-sm">{formatDateTime(l.lastAnchorAt)}</span>} />
                <Stat label={t("screens.reports.checked")} value={<span className="text-body-sm">{formatDateTime(l.checkedAt)}</span>} />
              </div>
              <p className="text-body-sm text-text-muted"><code>{l.anchorObject}</code></p>
            </div>
          )}
        </QueryView>
      </Panel>
      <QueryView query={reports} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {d.items.map((r) => (
              <Card key={r.id}>
                <article className="flex h-full flex-col gap-3">
                  <h2 className="text-h4">{r.name}</h2>
                  <p className="flex-1 text-body-sm text-text-muted">{r.description}</p>
                  <p className="text-body-sm text-text-muted">{t("screens.reports.lastRun")}: {r.lastRunAt ? formatDateTime(r.lastRunAt) : t("screens.common.never")}</p>
                  <div className="flex flex-wrap gap-2">
                    {r.formats.map((f) => (
                      <Button key={f} size="sm" variant="ghost" onClick={() => setQueued(`${r.id}-${f}`)}>{t("screens.reports.run", { format: f })}</Button>
                    ))}
                  </div>
                  {queued?.startsWith(r.id) ? <StatusBadge tone="success" label={t("screens.reports.exported")} /> : null}
                </article>
              </Card>
            ))}
          </div>
        )}
      </QueryView>
    </div>
  );
}
