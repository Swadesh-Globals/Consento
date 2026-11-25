"use client";

import { StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, useInventory } from "@/features/workspace";
import { formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useInventory();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.inventory")} lead={t("screens.inventory.lead")} featureIds="CFG-17" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.inventory")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "p", header: t("screens.inventory.cols.purpose"), cell: (r) => r.purposeName },
              { key: "d", header: t("screens.inventory.cols.data"), cell: (r) => r.dataCategories.join(", ") },
              { key: "s", header: t("screens.inventory.cols.systems"), cell: (r) => r.systems.join(", ") },
              { key: "r", header: t("screens.inventory.cols.retention"), cell: (r) => t("screens.purposes.days", { days: formatNumber(r.retentionDays) }) },
              { key: "o", header: t("screens.inventory.cols.source"), cell: (r) => <StatusBadge tone={r.source === "discovery" ? "info" : "neutral"} label={t(`screens.inventory.source.${r.source}`)} /> },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
