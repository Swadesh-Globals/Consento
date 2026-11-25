"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, useAuditLog } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useAuditLog();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.auditLog")} lead={t("screens.auditLog.lead")} featureIds="CFG-15" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.auditLog")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "a", header: t("screens.auditLog.cols.at"), cell: (r) => formatDateTime(r.at) },
              { key: "u", header: t("screens.auditLog.cols.actor"), cell: (r) => r.actorName },
              { key: "x", header: t("screens.auditLog.cols.action"), cell: (r) => r.action },
              { key: "t", header: t("screens.auditLog.cols.target"), cell: (r) => r.target },
              { key: "i", header: t("screens.auditLog.cols.ip"), cell: (r) => <code>{r.ip}</code> },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
