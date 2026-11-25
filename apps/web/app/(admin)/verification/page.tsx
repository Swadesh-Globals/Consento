"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useVerificationSettings } from "@/features/workspace";

export default function Page() {
  const { t } = useTranslation();
  const query = useVerificationSettings();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.verification")} lead={t("screens.verification.lead")} featureIds="CFG-19" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.verification")}
            rows={d.items}
            rowKey={(r) => r.requestType}
            columns={[
              { key: "t", header: t("screens.verification.cols.type"), cell: (r) => t(`screens.requestType.${r.requestType}`) },
              { key: "m", header: t("screens.verification.cols.method"), cell: (r) => t(`screens.verification.method.${r.method}`) },
              { key: "s", header: t("screens.verification.cols.strength"), cell: (r) => <Status value={r.strength} /> },
              {
                key: "r",
                header: t("screens.verification.cols.reverify"),
                cell: (r) => (r.reverifyDays === 0 ? t("screens.verification.every") : t("screens.verification.days", { days: r.reverifyDays })),
              },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
