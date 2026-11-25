"use client";

import { StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, useLogRetention } from "@/features/workspace";
import { formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useLogRetention();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.logRetention")} lead={t("screens.logRetention.lead")} featureIds="CFG-22" />
      <QueryView query={query}>
        {(d) => (
          <>
            <StatusBadge tone="info" label={t("screens.logRetention.minimum", { days: d.minimumDays })} />
            <DataTable
              caption={t("nav.admin.logRetention")}
              rows={d.items}
              rowKey={(r) => r.logType}
              columns={[
                { key: "t", header: t("screens.logRetention.cols.type"), cell: (r) => r.logType },
                { key: "d", header: t("screens.logRetention.cols.days"), cell: (r) => t("screens.purposes.days", { days: formatNumber(r.retentionDays) }) },
                { key: "r", header: t("screens.logRetention.cols.region"), cell: (r) => r.region },
                { key: "i", header: t("screens.logRetention.cols.immutable"), cell: (r) => t(r.immutable ? "screens.common.yes" : "screens.common.no") },
              ]}
            />
          </>
        )}
      </QueryView>
    </div>
  );
}
