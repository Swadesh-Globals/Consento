"use client";

import { StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useUsers } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useUsers();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.users")} lead={t("screens.users.lead")} featureIds="CFG-04 · CFG-07" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.admin.users")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "n", header: t("screens.users.cols.name"), cell: (r) => r.name },
              { key: "e", header: t("screens.users.cols.email"), cell: (r) => r.email },
              { key: "r", header: t("screens.users.cols.role"), cell: (r) => t(`common.role.${r.role}`) },
              { key: "s", header: t("screens.users.cols.status"), cell: (r) => <Status value={r.status} /> },
              { key: "m", header: t("screens.users.cols.mfa"), cell: (r) => <StatusBadge tone={r.mfa ? "success" : "warning"} label={t(r.mfa ? "screens.users.mfaOn" : "screens.users.mfaOff")} /> },
              { key: "l", header: t("screens.users.cols.last"), cell: (r) => (r.lastActiveAt ? formatDateTime(r.lastActiveAt) : t("screens.common.never")) },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
