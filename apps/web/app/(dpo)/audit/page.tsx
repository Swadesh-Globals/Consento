"use client";

import { Button } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useAuditPacks, useCreateAuditPack } from "@/features/workspace";
import { formatDateTime, formatNumber } from "@/lib/format";

const PERIODS = ["Q4 2026 (to date)", "Q3 2026", "Q2 2026", "FY 2025-26"];

export default function Page() {
  const { t } = useTranslation();
  const query = useAuditPacks();
  const create = useCreateAuditPack();
  const [period, setPeriod] = useState(PERIODS[0] ?? "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.dpo.audit")}
        lead={t("screens.audit.lead")}
        featureIds="DPO-07"
        action={
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-2 text-label">
              {t("screens.audit.period")}
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body">
                {PERIODS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Button disabled={create.isPending} onClick={() => create.mutate(period)}>{t("screens.audit.generate")}</Button>
          </div>
        }
      />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.audit")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "p", header: t("screens.audit.cols.period"), cell: (r) => r.period },
              { key: "b", header: t("screens.audit.cols.by"), cell: (r) => r.requestedBy },
              { key: "c", header: t("screens.audit.cols.created"), cell: (r) => formatDateTime(r.createdAt) },
              { key: "s", header: t("screens.audit.cols.size"), cell: (r) => `${formatNumber(Math.round(r.sizeKb / 102.4) / 10)} MB` },
              { key: "i", header: t("screens.audit.cols.sections"), cell: (r) => <span className="text-text-muted">{r.sections.join(", ")}</span> },
              { key: "st", header: t("screens.audit.cols.status"), cell: (r) => <Status value={r.status} /> },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
