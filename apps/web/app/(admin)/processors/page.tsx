"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useProcessors } from "@/features/workspace";
import { formatDate } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useProcessors();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.processors")} lead={t("screens.processors.lead")} featureIds="CFG-16" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.processors")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "n", header: t("screens.processors.cols.name"), cell: (r) => r.name },
              { key: "s", header: t("screens.processors.cols.service"), cell: (r) => r.service },
              { key: "p", header: t("screens.processors.cols.purposes"), cell: (r) => r.purposes.join(", ") },
              { key: "d", header: t("screens.processors.cols.dpa"), cell: (r) => <Status value={r.dpaStatus} /> },
              { key: "e", header: t("screens.processors.cols.expires"), cell: (r) => (r.dpaExpiresAt ? formatDate(r.dpaExpiresAt) : "—") },
              { key: "r", header: t("screens.processors.cols.region"), cell: (r) => r.region },
              { key: "i", header: t("screens.processors.cols.pending"), cell: (r) => r.instructionsPending },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
