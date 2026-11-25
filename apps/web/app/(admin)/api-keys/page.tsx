"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useApiKeys } from "@/features/workspace";
import { formatDate, formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useApiKeys();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.apiKeys")} lead={t("screens.apiKeys.lead")} featureIds="CFG-05" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.apiKeys")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "n", header: t("screens.apiKeys.cols.name"), cell: (r) => r.name },
              { key: "p", header: t("screens.apiKeys.cols.prefix"), cell: (r) => <code>{r.prefix}…</code> },
              { key: "s", header: t("screens.apiKeys.cols.scopes"), cell: (r) => r.scopes.join(", ") },
              { key: "st", header: t("screens.apiKeys.cols.status"), cell: (r) => <Status value={r.status} /> },
              { key: "c", header: t("screens.apiKeys.cols.created"), cell: (r) => formatDate(r.createdAt) },
              { key: "l", header: t("screens.apiKeys.cols.last"), cell: (r) => (r.lastUsedAt ? formatDateTime(r.lastUsedAt) : t("screens.common.never")) },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
