"use client";

import { Button } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, QueryView, Status, useErasures, useToggleErasureHold } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useErasures();
  const hold = useToggleErasureHold();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.erasure")} lead={t("screens.erasure.lead")} featureIds="DPO-13 · CFG-09" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.erasure")}
            rows={[...d.items].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))}
            rowKey={(r) => r.id}
            columns={[
              { key: "c", header: t("screens.erasure.cols.contact"), cell: (r) => r.maskedContact },
              { key: "p", header: t("screens.erasure.cols.purpose"), cell: (r) => r.purposeName },
              { key: "r", header: t("screens.erasure.cols.rule"), cell: (r) => r.ruleClass },
              { key: "d", header: t("screens.erasure.cols.scheduled"), cell: (r) => formatDateTime(r.scheduledAt) },
              { key: "n", header: t("screens.erasure.cols.notice"), cell: (r) => (r.noticeSentAt ? formatDateTime(r.noticeSentAt) : "—") },
              { key: "s", header: t("screens.erasure.cols.status"), cell: (r) => <Status value={r.status} /> },
              { key: "k", header: t("screens.erasure.cols.cert"), cell: (r) => (r.certificateId ? <code>{r.certificateId}</code> : "—") },
              {
                key: "x",
                header: t("screens.erasure.cols.actions"),
                cell: (r) =>
                  r.status === "erased" ? null : (
                    <Button size="sm" variant="ghost" disabled={hold.isPending} onClick={() => hold.mutate(r.id)}>
                      {t(r.status === "held" ? "screens.erasure.release" : "screens.erasure.hold")}
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
