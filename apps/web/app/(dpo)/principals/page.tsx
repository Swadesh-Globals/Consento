"use client";

import { StatusBadge } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, Panel, QueryView, Status, usePrincipal, usePrincipals } from "@/features/workspace";
import { formatDate, formatDateTime, shortHash } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const list = usePrincipals(q);
  const detail = usePrincipal(selected);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.principals")} lead={t("screens.principals.lead")} featureIds="DPO-02" />
      <label className="flex max-w-md flex-col gap-2 text-label">
        {t("screens.principals.searchLabel")}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring"
        />
      </label>
      <div className="grid gap-5 xl:grid-cols-5">
        <div className="flex flex-col gap-3 xl:col-span-2">
          <QueryView query={list} isEmpty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <p className="text-body-sm text-text-muted">{t("screens.principals.results", { total: d.total })}</p>
                <DataTable
                  caption={t("nav.dpo.principals")}
                  rows={d.items}
                  rowKey={(r) => r.id}
                  selectedKey={selected}
                  onSelect={(r) => setSelected(r.id)}
                  columns={[
                    { key: "c", header: t("screens.principals.cols.contact"), cell: (r) => <><div>{r.maskedContact}</div><div className="text-text-muted">{r.id}</div></> },
                    { key: "a", header: t("screens.principals.cols.active"), cell: (r) => r.activeConsents },
                    { key: "w", header: t("screens.principals.cols.withdrawn"), cell: (r) => r.withdrawnConsents },
                    { key: "l", header: t("screens.principals.cols.last"), cell: (r) => formatDate(r.lastActivityAt) },
                  ]}
                />
              </>
            )}
          </QueryView>
        </div>
        <div className="flex flex-col gap-5 xl:col-span-3">
          {!selected ? (
            <Panel title={t("screens.principals.consents")}>
              <p className="text-body text-text-muted">{t("screens.principals.selectHint")}</p>
            </Panel>
          ) : (
            <QueryView query={detail}>
              {(d) => (
                <>
                  <Panel title={`${t("screens.principals.consents")} · ${d.principal.maskedContact}`}>
                    <DataTable
                      caption={t("screens.principals.consents")}
                      rows={d.consents}
                      rowKey={(r) => r.id}
                      columns={[
                        { key: "p", header: t("screens.principals.ccols.purpose"), cell: (r) => r.purpose.name },
                        { key: "s", header: t("screens.principals.ccols.status"), cell: (r) => <Status value={r.status} /> },
                        { key: "n", header: t("screens.principals.ccols.notice"), cell: (r) => r.noticeVersion },
                        { key: "c", header: t("screens.principals.ccols.channel"), cell: (r) => t(`overview.channels.${r.channel}`) },
                        { key: "g", header: t("screens.principals.ccols.granted"), cell: (r) => (r.grantedAt ? formatDate(r.grantedAt) : "—") },
                        { key: "v", header: t("screens.principals.ccols.validUntil"), cell: (r) => (r.validUntil ? formatDate(r.validUntil) : "—") },
                      ]}
                    />
                  </Panel>
                  <Panel title={t("screens.principals.ledger")}>
                    {d.chainVerified ? <StatusBadge tone="success" label={t("screens.principals.chainOk")} /> : null}
                    <DataTable
                      caption={t("screens.principals.ledger")}
                      rows={d.ledger}
                      rowKey={(r) => `${r.seq}`}
                      columns={[
                        { key: "q", header: t("screens.principals.lcols.seq"), cell: (r) => r.seq },
                        { key: "e", header: t("screens.principals.lcols.event"), cell: (r) => <Status value={r.event} /> },
                        { key: "p", header: t("screens.principals.lcols.purpose"), cell: (r) => r.purposeName },
                        { key: "a", header: t("screens.principals.lcols.at"), cell: (r) => formatDateTime(r.at) },
                        { key: "h", header: t("screens.principals.lcols.hash"), cell: (r) => <code>{shortHash(r.entryHash)}</code> },
                        { key: "v", header: t("screens.principals.lcols.prev"), cell: (r) => <code className="text-text-muted">{shortHash(r.prevHash)}</code> },
                      ]}
                    />
                  </Panel>
                </>
              )}
            </QueryView>
          )}
        </div>
      </div>
    </div>
  );
}
