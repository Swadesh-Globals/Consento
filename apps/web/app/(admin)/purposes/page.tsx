"use client";

import { StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, usePurposes } from "@/features/workspace";
import { formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = usePurposes();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.purposes")} lead={t("screens.purposes.lead")} featureIds="CFG-01 · CFG-08" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.purposes")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "n",
                header: t("screens.purposes.cols.name"),
                cell: (r) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{r.name} {r.mandatory ? <StatusBadge tone="info" label={t("screens.purposes.mandatory")} /> : null}</span>
                    <span className="text-text-muted">{r.description}</span>
                  </div>
                ),
              },
              { key: "b", header: t("screens.purposes.cols.basis"), cell: (r) => t(`screens.purposes.basis.${r.lawfulBasis}`) },
              { key: "e", header: t("screens.purposes.cols.elements"), cell: (r) => r.dataElements.map((e) => e.name).join(", ") },
              { key: "r", header: t("screens.purposes.cols.retention"), cell: (r) => t("screens.purposes.days", { days: formatNumber(r.retentionDays) }) },
              { key: "c", header: t("screens.purposes.cols.consents"), cell: (r) => formatNumber(r.activeConsents) },
              { key: "s", header: t("screens.purposes.cols.status"), cell: (r) => <Status value={r.status} /> },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
