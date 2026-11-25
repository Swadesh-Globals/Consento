"use client";

import { Button, ConfirmDialog } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, Due, PageHeader, QueryView, Status, useGrievances, useUpdateGrievance } from "@/features/workspace";
import { formatDate } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useGrievances();
  const update = useUpdateGrievance();
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.grievances")} lead={t("screens.grievances.lead")} featureIds="DPO-05" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <DataTable
            caption={t("nav.dpo.grievances")}
            rows={[...d.items].sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved") || Date.parse(a.dueAt) - Date.parse(b.dueAt))}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "s",
                header: t("screens.grievances.cols.subject"),
                cell: (r) => (
                  <div className="flex flex-col gap-1">
                    <span>{r.subject}</span>
                    {r.closureNote ? <span className="text-text-muted">{r.closureNote}</span> : null}
                    {r.evidence.length ? <span className="text-text-muted">{t("screens.grievances.evidence")}: {r.evidence.join(", ")}</span> : null}
                  </div>
                ),
              },
              { key: "c", header: t("screens.grievances.cols.category"), cell: (r) => t(`screens.grievances.category.${r.category}`) },
              { key: "p", header: t("screens.grievances.cols.contact"), cell: (r) => r.maskedContact },
              { key: "st", header: t("screens.grievances.cols.status"), cell: (r) => <Status value={r.status} /> },
              { key: "a", header: t("screens.grievances.cols.assignee"), cell: (r) => r.assignee ?? t("screens.common.unassigned") },
              { key: "o", header: t("screens.grievances.cols.opened"), cell: (r) => formatDate(r.openedAt) },
              { key: "d", header: t("screens.grievances.cols.cap"), cell: (r) => <Due iso={r.dueAt} done={r.status === "resolved"} /> },
              {
                key: "x",
                header: t("screens.grievances.cols.actions"),
                cell: (r) =>
                  r.status === "resolved" ? null : (
                    <div className="flex gap-2">
                      {r.status === "open" ? (
                        <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: r.id, status: "escalated" })}>
                          {t("screens.grievances.escalate")}
                        </Button>
                      ) : null}
                      <Button size="sm" disabled={update.isPending} onClick={() => { setNote(""); setResolving(r.id); }}>
                        {t("screens.grievances.resolve")}
                      </Button>
                    </div>
                  ),
              },
            ]}
          />
        )}
      </QueryView>
      <ConfirmDialog
        open={resolving !== null}
        title={t("screens.grievances.resolveTitle")}
        consequence={t("screens.grievances.closureNote")}
        confirmLabel={t("screens.grievances.resolve")}
        cancelLabel={t("common.actions.cancel")}
        tone="primary"
        pending={update.isPending}
        onCancel={() => setResolving(null)}
        onConfirm={() => resolving && update.mutate({ id: resolving, status: "resolved", closureNote: note }, { onSettled: () => setResolving(null) })}
      >
        <textarea
          aria-label={t("screens.grievances.closureNote")}
          rows={4}
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-body"
        />
      </ConfirmDialog>
    </div>
  );
}
