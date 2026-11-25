"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, useWorkflowRules } from "@/features/workspace";

export default function Page() {
  const { t } = useTranslation();
  const query = useWorkflowRules();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.workflows")} lead={t("screens.workflows.lead")} featureIds="CFG-20" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.workflows")}
            rows={d.items}
            rowKey={(r) => r.requestType}
            columns={[
              { key: "t", header: t("screens.workflows.cols.type"), cell: (r) => t(`screens.requestType.${r.requestType}`) },
              { key: "s", header: t("screens.workflows.cols.sla"), cell: (r) => t("screens.purposes.days", { days: r.slaDays }) },
              { key: "a", header: t("screens.workflows.cols.approver"), cell: (r) => r.approver },
              { key: "u", header: t("screens.workflows.cols.assign"), cell: (r) => t(`screens.workflows.assign.${r.autoAssign}`) },
              { key: "e", header: t("screens.workflows.cols.escalate"), cell: (r) => t("screens.purposes.days", { days: r.escalateAfterDays }) },
              { key: "o", header: t("screens.workflows.cols.to"), cell: (r) => r.escalateTo },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
