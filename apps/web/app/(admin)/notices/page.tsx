"use client";

import { Button, ConfirmDialog, StatusBadge, cn } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, LanguagePicker, PageHeader, Panel, QueryView, Stat, Status, useLanguageContent, useNoticeDiff, useNotices, usePublishNotice } from "@/features/workspace";
import { formatDate, shortHash } from "@/lib/format";

function Diff({ id }: { id: string }) {
  const { t } = useTranslation();
  const diff = useNoticeDiff(id);
  return (
    <QueryView query={diff}>
      {(d) => (
        <div className="flex flex-col gap-3">
          <h3 className="text-label">{t("screens.noticeDiff.title", { from: d.from, to: d.to })}</h3>
          <ul className="flex flex-col gap-1 rounded-md border border-border p-3 font-mono text-body-sm">
            {d.lines.map((l, i) => (
              <li
                key={i}
                className={cn(l.op === "add" && "bg-success-fill text-success", l.op === "remove" && "bg-danger-fill text-danger line-through")}
              >
                <span aria-hidden>{l.op === "add" ? "+ " : l.op === "remove" ? "− " : "  "}</span>
                {l.text}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <h3 className="text-label">{t("screens.noticeDiff.reconsent")}</h3>
            <Status value={d.reconsent.campaignStatus} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat label={t("screens.noticeDiff.targeted")} value={d.reconsent.targeted} />
            <Stat label={t("screens.noticeDiff.done")} value={d.reconsent.reconsented} />
            <Stat label={t("screens.noticeDiff.pending")} value={d.reconsent.pending} />
          </div>
        </div>
      )}
    </QueryView>
  );
}

function NoticeText() {
  const { t } = useTranslation();
  const [lang, setLang] = useState("en");
  const content = useLanguageContent(lang);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-label">{t("screens.notices.text")}</h3>
        <LanguagePicker value={lang} onChange={setLang} />
      </div>
      <QueryView query={content}>
        {(c) =>
          c.notice ? (
            <div lang={c.code} dir={c.dir} className="whitespace-pre-line rounded-md border border-border bg-background p-3 text-body-sm">{c.notice}</div>
          ) : (
            <p className="text-body-sm text-text-muted">{t("screens.languages.notAdded")}</p>
          )
        }
      </QueryView>
    </div>
  );
}

export default function Page() {
  const { t } = useTranslation();
  const query = useNotices();
  const publish = usePublishNotice();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.notices")} lead={t("screens.notices.lead")} featureIds="CFG-02 · CFG-11" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => {
          const row = d.items.find((n) => n.id === selected);
          return (
            <div className="grid gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <DataTable
                  caption={t("nav.admin.notices")}
                  rows={d.items}
                  rowKey={(r) => r.id}
                  selectedKey={selected}
                  onSelect={(r) => setSelected(r.id)}
                  columns={[
                    { key: "t", header: t("screens.notices.cols.title"), cell: (r) => r.title },
                    { key: "v", header: t("screens.notices.cols.version"), cell: (r) => r.version },
                    { key: "s", header: t("screens.notices.cols.status"), cell: (r) => <Status value={r.status} /> },
                    {
                      key: "l",
                      header: t("screens.notices.cols.languages"),
                      cell: (r) => (
                        <span className="flex gap-1">
                          {(["en", "hi", "kn"] as const).map((l) => (
                            <StatusBadge key={l} tone={r.languages[l] ? "success" : "neutral"} label={l.toUpperCase()} />
                          ))}
                        </span>
                      ),
                    },
                    { key: "u", header: t("screens.notices.cols.updated"), cell: (r) => formatDate(r.updatedAt) },
                    {
                      key: "a",
                      header: t("screens.notices.cols.actions"),
                      cell: (r) => (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirm(r.id); }}>
                          {t("screens.notices.publish")}
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
              <Panel title={row ? `${t("screens.notices.versions")} · ${row.title}` : t("screens.notices.versions")}>
                {row ? (
                  <ol className="flex flex-col gap-2">
                    {[...row.versions].reverse().map((v) => (
                      <li key={v.version} className="flex justify-between gap-2 rounded-md border border-border p-3 text-body-sm">
                        <span className="font-semibold">{v.version}</span>
                        <span className="text-text-muted">{formatDate(v.publishedAt)}</span>
                        <code className="text-text-muted">{shortHash(v.hash)}</code>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {row ? <NoticeText /> : null}
                {row ? <Diff id={row.id} /> : null}
              </Panel>
            </div>
          );
        }}
      </QueryView>
      <ConfirmDialog
        open={confirm !== null}
        title={t("screens.notices.publishTitle")}
        consequence={t("screens.notices.publishConfirm")}
        confirmLabel={t("screens.notices.publish")}
        cancelLabel={t("common.actions.cancel")}
        tone="primary"
        pending={publish.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && publish.mutate(confirm, { onSettled: () => { setSelected(confirm); setConfirm(null); } })}
      />
    </div>
  );
}
