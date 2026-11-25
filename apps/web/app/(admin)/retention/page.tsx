"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, useRetention } from "@/features/workspace";
import { formatDate, formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useRetention();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.retention")} lead={t("screens.retention.lead")} featureIds="CFG-09" />
      <p className="text-body-sm text-text-muted">{t("screens.retention.notice")}</p>
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.retention")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "p", header: t("screens.retention.cols.purpose"), cell: (r) => r.purposeName },
              { key: "d", header: t("screens.retention.cols.period"), cell: (r) => t("screens.purposes.days", { days: formatNumber(r.retentionDays) }) },
              { key: "t", header: t("screens.retention.cols.trigger"), cell: (r) => t(`screens.retention.trigger.${r.trigger}`) },
              { key: "a", header: t("screens.retention.cols.action"), cell: (r) => t(`screens.retention.action.${r.action}`) },
              { key: "n", header: t("screens.retention.cols.next"), cell: (r) => formatDate(r.nextRunAt) },
              { key: "e", header: t("screens.retention.cols.pending"), cell: (r) => formatNumber(r.pendingErasures) },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
