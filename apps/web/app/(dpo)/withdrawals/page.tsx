"use client";

import { Button, StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useRetryWithdrawal, useWithdrawals } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useWithdrawals();
  const retry = useRetryWithdrawal();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.withdrawals")} lead={t("screens.withdrawals.lead")} featureIds="DPO-11 · ENG-07 · INT-02" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.withdrawals")}
            rows={d.items}
            rowKey={(r) => r.id}
            columns={[
              { key: "c", header: t("screens.withdrawals.cols.contact"), cell: (r) => r.maskedContact },
              { key: "p", header: t("screens.withdrawals.cols.purpose"), cell: (r) => r.purposeName },
              { key: "a", header: t("screens.withdrawals.cols.at"), cell: (r) => formatDateTime(r.withdrawnAt) },
              {
                key: "t",
                header: t("screens.withdrawals.cols.targets"),
                cell: (r) => (
                  <ul className="flex flex-col gap-1">
                    {r.targets.map((x) => (
                      <li key={x.name} className="flex flex-wrap items-center gap-2">
                        <Status value={x.status} />
                        <span>{x.name}</span>
                        <span className="text-text-muted">
                          {t(`screens.withdrawals.kind.${x.kind}`)}
                          {x.ackAt ? ` · ${Math.round((Date.parse(x.ackAt) - Date.parse(r.withdrawnAt)) / 1000)} s` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                key: "s",
                header: t("screens.withdrawals.cols.state"),
                cell: (r) => {
                  const open = r.targets.filter((x) => x.status !== "confirmed").length;
                  return open === 0 ? (
                    <StatusBadge tone="success" label={t("screens.withdrawals.allConfirmed")} />
                  ) : (
                    <StatusBadge tone="warning" label={t("screens.withdrawals.outstanding", { count: open })} />
                  );
                },
              },
              {
                key: "x",
                header: t("screens.withdrawals.cols.actions"),
                cell: (r) =>
                  r.targets.every((x) => x.status === "confirmed") ? null : (
                    <Button size="sm" variant="ghost" disabled={retry.isPending} onClick={() => retry.mutate(r.id)}>
                      {t("screens.withdrawals.retry")}
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </QueryView>
    </div>
  );
}
