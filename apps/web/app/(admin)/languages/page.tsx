"use client";

import type { LanguageContent } from "@consent/schemas";
import { Button, StatusBadge, cn } from "@consent/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, Panel, Progress, QueryView, Status, useLanguageContent, useLanguagePacks, useSavePrivacyPolicy } from "@/features/workspace";
import { formatDate } from "@/lib/format";

type Tab = "privacyPolicy" | "notice" | "banner";

function Text({ c, children }: { c: LanguageContent; children: string }) {
  const { t } = useTranslation();
  if (!children) return <p className="text-body-sm text-text-muted">{t("screens.languages.notAdded")}</p>;
  return (
    <div lang={c.code} dir={c.dir} className="whitespace-pre-line rounded-md border border-border bg-background p-4 text-body">
      {children}
    </div>
  );
}

function PolicyEditor({ c }: { c: LanguageContent }) {
  const { t } = useTranslation();
  const save = useSavePrivacyPolicy();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.privacyPolicy);
  useEffect(() => setDraft(c.privacyPolicy), [c.privacyPolicy]);

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <Text c={c}>{c.privacyPolicy}</Text>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>{t("screens.languages.edit")}</Button>
          {save.isSuccess ? <StatusBadge tone="success" label={t("screens.languages.saved")} /> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <textarea
        lang={c.code}
        dir={c.dir}
        aria-label={t("screens.languages.tabs.privacyPolicy")}
        rows={18}
        maxLength={20000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={save.isPending || draft.trim().length === 0}
          onClick={() => save.mutate({ code: c.code, privacyPolicy: draft }, { onSuccess: () => setEditing(false) })}
        >
          {t("screens.languages.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setDraft(c.privacyPolicy); setEditing(false); }}>
          {t("common.actions.cancel")}
        </Button>
      </div>
    </div>
  );
}

function ContentPanel({ code }: { code: string }) {
  const { t } = useTranslation();
  const query = useLanguageContent(code);
  const [tab, setTab] = useState<Tab>("privacyPolicy");
  return (
    <QueryView query={query}>
      {(c) => (
        <div className="flex flex-col gap-4">
          <div role="tablist" className="flex gap-2">
            {(["privacyPolicy", "notice", "banner"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn("rounded-md border px-3 py-1 text-label", tab === k ? "border-primary bg-primary text-on-primary" : "border-border-strong text-primary")}
              >
                {t(`screens.languages.tabs.${k}`)}
              </button>
            ))}
          </div>
          {c.updatedAt ? <p className="text-body-sm text-text-muted">{t("screens.languages.updated", { date: formatDate(c.updatedAt) })}</p> : null}
          {tab === "privacyPolicy" ? <PolicyEditor c={c} /> : null}
          {tab === "notice" ? <Text c={c}>{c.notice}</Text> : null}
          {tab === "banner" ? (
            c.banner.title ? (
              <div lang={c.code} dir={c.dir} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
                <h3 className="text-h4">{c.banner.title}</h3>
                <p className="text-body-sm text-text-muted">{c.banner.body}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">{c.banner.acceptLabel}</Button>
                  <Button size="sm">{c.banner.rejectLabel}</Button>
                  <Button size="sm" variant="ghost">{c.banner.customiseLabel}</Button>
                </div>
              </div>
            ) : (
              <Text c={c}>{""}</Text>
            )
          ) : null}
        </div>
      )}
    </QueryView>
  );
}

export default function Page() {
  const { t } = useTranslation();
  const query = useLanguagePacks();
  const [selected, setSelected] = useState<string>("en");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.languages")} lead={t("screens.languages.lead")} featureIds="CFG-11 · COL-05" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => {
          const row = d.items.find((r) => r.code === selected);
          return (
            <div className="grid gap-5 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <DataTable
                  caption={t("nav.admin.languages")}
                  rows={d.items}
                  rowKey={(r) => r.code}
                  selectedKey={selected}
                  onSelect={(r) => setSelected(r.code)}
                  columns={[
                    { key: "l", header: t("screens.languages.cols.language"), cell: (r) => r.name },
                    { key: "pp", header: t("screens.languages.cols.policy"), cell: (r) => <Status value={r.privacyPolicy} /> },
                    { key: "n", header: t("screens.languages.cols.notice"), cell: (r) => <Status value={r.notice} /> },
                    { key: "b", header: t("screens.languages.cols.banner"), cell: (r) => <Status value={r.banner} /> },
                    {
                      key: "p",
                      header: t("screens.languages.cols.pct"),
                      cell: (r) => (
                        <span className="flex items-center gap-2">
                          <Progress pct={r.translatedPct} tone={r.translatedPct >= 100 ? "success" : r.translatedPct >= 60 ? "warning" : "danger"} className="w-16" />
                          {r.translatedPct}%
                        </span>
                      ),
                    },
                    { key: "r", header: t("screens.languages.cols.reviewer"), cell: (r) => r.reviewer ?? "—" },
                  ]}
                />
              </div>
              <Panel title={row?.name ?? t("screens.languages.select")} className="xl:col-span-2">
                {row ? <ContentPanel key={row.code} code={row.code} /> : <p className="text-body-sm text-text-muted">{t("screens.languages.select")}</p>}
              </Panel>
            </div>
          );
        }}
      </QueryView>
    </div>
  );
}
