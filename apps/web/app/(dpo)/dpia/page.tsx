"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useAssessments } from "@/features/workspace";
import { formatDate } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useAssessments();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.dpia")} lead={t("screens.dpia.lead")} featureIds="DPO-09" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.dpia")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "t", header: t("screens.dpia.cols.title"), cell: (r) => r.title },
              { key: "k", header: t("screens.dpia.cols.kind"), cell: (r) => t(`screens.dpia.kind.${r.kind}`) },
              { key: "s", header: t("screens.dpia.cols.status"), cell: (r) => <Status value={r.status} /> },
              { key: "o", header: t("screens.dpia.cols.owner"), cell: (r) => r.owner },
              { key: "d", header: t("screens.dpia.cols.due"), cell: (r) => formatDate(r.dueAt) },
              { key: "e", header: t("screens.dpia.cols.evidence"), cell: (r) => r.evidenceLinked },
              { key: "f", header: t("screens.dpia.cols.findings"), cell: (r) => r.openFindings },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
