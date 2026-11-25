"use client";

import { Button } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useDecideGuardian, useGuardianConsents } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useGuardianConsents();
  const decide = useDecideGuardian();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.guardian")} lead={t("screens.guardian.lead")} featureIds="DPO-12 · COL-08" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.guardian")}
            rows={[...d.items].sort((a, b) => Number(a.status !== "pending") - Number(b.status !== "pending"))}
            rowKey={(r) => r.id}
            columns={[
              { key: "k", header: t("screens.guardian.cols.kind"), cell: (r) => t(`screens.guardian.kind.${r.kind}`) },
              { key: "p", header: t("screens.guardian.cols.principal"), cell: (r) => r.principalMasked },
              { key: "g", header: t("screens.guardian.cols.guardian"), cell: (r) => r.guardianMasked },
              { key: "a", header: t("screens.guardian.cols.age"), cell: (r) => t(`screens.guardian.age.${r.ageGate}`) },
              { key: "m", header: t("screens.guardian.cols.method"), cell: (r) => t(`screens.guardian.method.${r.method}`) },
              { key: "u", header: t("screens.guardian.cols.purpose"), cell: (r) => r.purposeName },
              { key: "d", header: t("screens.guardian.cols.submitted"), cell: (r) => formatDateTime(r.submittedAt) },
              { key: "s", header: t("screens.guardian.cols.status"), cell: (r) => <Status value={r.status} /> },
              {
                key: "x",
                header: t("screens.guardian.cols.actions"),
                cell: (r) =>
                  r.status !== "pending" ? null : (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, status: "verified" })}>{t("screens.guardian.verify")}</Button>
                      <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, status: "rejected" })}>{t("screens.guardian.reject")}</Button>
                    </div>
                  ),
              },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
