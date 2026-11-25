"use client";

import { Button, ConfirmDialog } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, Due, PageHeader, Panel, QueryView, Status, useDsrs, useResponseTemplates, useUpdateDsr } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useDsrs();
  const update = useUpdateDsr();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [response, setResponse] = useState("");
  const templates = useResponseTemplates();
  const closed = (s: string) => s === "completed" || s === "rejected";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.dsr")} lead={t("screens.dsr.lead")} featureIds="DPO-03 · DPO-04" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => {
          const row = d.items.find((r) => r.id === selected) ?? null;
          const sorted = [...d.items].sort((a, b) => Number(closed(a.status)) - Number(closed(b.status)) || Date.parse(a.dueAt) - Date.parse(b.dueAt));
          return (
            <div className="grid gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <DataTable
                  caption={t("nav.dpo.dsr")}
                  rows={sorted}
                  rowKey={(r) => r.id}
                  selectedKey={selected}
                  onSelect={(r) => { setSelected(r.id); setResponse(""); }}
                  columns={[
                    { key: "i", header: t("screens.dsr.cols.id"), cell: (r) => <code>{r.id}</code> },
                    { key: "t", header: t("screens.dsr.cols.type"), cell: (r) => t(`screens.dsr.type.${r.type}`) },
                    { key: "c", header: t("screens.dsr.cols.contact"), cell: (r) => r.maskedContact },
                    { key: "s", header: t("screens.dsr.cols.status"), cell: (r) => <Status value={r.status} /> },
                    { key: "a", header: t("screens.dsr.cols.assignee"), cell: (r) => r.assignee ?? t("screens.common.unassigned") },
                    { key: "v", header: t("screens.dsr.cols.verified"), cell: (r) => t(r.identityVerified ? "screens.common.yes" : "screens.common.no") },
                    { key: "d", header: t("screens.dsr.cols.due"), cell: (r) => <Due iso={r.dueAt} done={closed(r.status)} /> },
                  ]}
                />
              </div>
              <Panel title={row ? `${t(`screens.dsr.type.${row.type}`)} · ${row.maskedContact}` : t("screens.dsr.timeline")}>
                {!row ? (
                  <p className="text-body text-text-muted">{t("screens.dsr.selectHint")}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Status value={row.status} />
                      <Due iso={row.dueAt} done={closed(row.status)} />
                    </div>
                    <ol className="flex flex-col gap-3 border-l border-border pl-4">
                      {row.timeline.map((e, i) => (
                        <li key={i} className="flex flex-col text-body-sm">
                          <span className="text-text-muted">{formatDateTime(e.at)} · {e.actor}</span>
                          <span>{e.note}</span>
                        </li>
                      ))}
                    </ol>
                    {!closed(row.status) ? (
                      <div className="flex flex-col gap-2">
                        <label className="flex flex-col gap-2 text-label">
                          {t("screens.dsr.template")}
                          <select
                            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body"
                            value=""
                            onChange={(e) => setResponse(templates.data?.items.find((x) => x.id === e.target.value)?.body ?? response)}
                          >
                            <option value="">{t("screens.dsr.useTemplate")}</option>
                            {templates.data?.items
                              .filter((x) => x.requestType === row.type || x.requestType === "any")
                              .map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-label">
                          {t("screens.dsr.response")}
                          <textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body" />
                        </label>
                      </div>
                    ) : null}
                    {!closed(row.status) ? (
                      <div className="flex flex-wrap gap-2">
                        {row.status === "submitted" ? (
                          <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: row.id, status: "in_progress" })}>
                            {t("screens.dsr.start")}
                          </Button>
                        ) : (
                          <Button size="sm" disabled={update.isPending} onClick={() => setConfirm(true)}>
                            {t("screens.dsr.complete")}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: row.id, status: "rejected" })}>
                          {t("screens.dsr.reject")}
                        </Button>
                      </div>
                    ) : null}
                    <ConfirmDialog
                      open={confirm}
                      title={t("screens.dsr.complete")}
                      consequence={t("screens.dsr.completeConfirm")}
                      confirmLabel={t("screens.dsr.complete")}
                      cancelLabel={t("common.actions.cancel")}
                      tone="primary"
                      pending={update.isPending}
                      onCancel={() => setConfirm(false)}
                      onConfirm={() => update.mutate({ id: row.id, status: "completed" }, { onSettled: () => setConfirm(false) })}
                    />
                  </>
                )}
              </Panel>
            </div>
          );
        }}
      </QueryView>
    </div>
  );
}
