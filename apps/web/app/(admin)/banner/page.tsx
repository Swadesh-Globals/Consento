"use client";

import type { BannerConfig } from "@consent/schemas";
import { Button, StatusBadge, cn } from "@consent/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguagePicker, PageHeader, Panel, QueryView, Stat, useBanner, useLanguageContent, usePurposes, useSaveBanner } from "@/features/workspace";
import { formatNumber } from "@/lib/format";

const input = "rounded-md border border-border-strong bg-surface px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring";

function Designer({ initial }: { initial: BannerConfig }) {
  const { t } = useTranslation();
  const save = useSaveBanner();
  const purposes = usePurposes();
  const [b, setB] = useState(initial);
  const [lang, setLang] = useState("en");
  const content = useLanguageContent(lang === "en" ? null : lang);
  const translated = lang === "en" || Boolean(content.data?.banner.title);
  const copy = lang !== "en" && content.data?.banner.title ? content.data.banner : b;
  const dir = lang !== "en" && translated ? content.data?.dir : "ltr";
  useEffect(() => setB(initial), [initial]);
  const set = <K extends keyof BannerConfig>(k: K, v: BannerConfig[K]) => setB((x) => ({ ...x, [k]: v }));

  const field = (k: "title" | "acceptLabel" | "rejectLabel" | "customiseLabel", label: string) => (
    <label className="flex flex-col gap-2 text-label">
      {label}
      <input className={input} value={b[k]} maxLength={80} onChange={(e) => set(k, e.target.value)} />
    </label>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <Panel title={t("screens.banner.design")} className="xl:col-span-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-label">{t("screens.banner.layout")}</legend>
          <div className="flex gap-2">
            {(["bar", "box", "modal"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={b.layout === l}
                onClick={() => set("layout", l)}
                className={cn("rounded-md border px-3 py-1 text-label", b.layout === l ? "border-primary bg-primary text-on-primary" : "border-border-strong text-primary")}
              >
                {t(`screens.banner.layouts.${l}`)}
              </button>
            ))}
          </div>
        </fieldset>
        {field("title", t("screens.banner.titleField"))}
        <label className="flex flex-col gap-2 text-label">
          {t("screens.banner.bodyField")}
          <textarea className={input} rows={4} maxLength={400} value={b.body} onChange={(e) => set("body", e.target.value)} />
        </label>
        {field("acceptLabel", t("screens.banner.accept"))}
        {field("rejectLabel", t("screens.banner.reject"))}
        {field("customiseLabel", t("screens.banner.customise"))}
        <div className="flex items-center gap-3">
          <Button disabled={save.isPending} onClick={() => save.mutate(b)}>{t("screens.banner.save")}</Button>
          {save.isSuccess ? <StatusBadge tone="success" label={t("screens.banner.saved")} /> : null}
        </div>
      </Panel>

      <Panel title={t("screens.banner.preview")} className="xl:col-span-3">
        <LanguagePicker value={lang} onChange={setLang} all />
        {!translated && content.data ? <p className="text-body-sm text-warning">{t("screens.banner.fallback", { name: content.data.name })}</p> : null}
        <div className="relative flex min-h-[460px] flex-col overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <span className="text-label">{t("screens.banner.siteName")}</span>
            <span className="text-body-sm text-text-muted">shop.example.in</span>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4 opacity-60" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-20 rounded-md bg-surface-tint" />)}
          </div>
          {b.layout === "modal" ? <div className="absolute inset-0 bg-navy-950/40" aria-hidden /> : null}
          <div
            role="dialog"
            lang={translated ? lang : "en"}
            dir={dir}
            aria-label={copy.title}
            className={cn(
              "absolute flex flex-col gap-3 border border-border bg-surface p-4 shadow-lg",
              b.layout === "bar" && "inset-x-0 bottom-0",
              b.layout === "box" && "bottom-4 left-4 max-w-sm rounded-lg",
              b.layout === "modal" && "left-1/2 top-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl",
            )}
          >
            <h3 className="text-h4">{copy.title}</h3>
            <p className="text-body-sm text-text-muted">{copy.body}</p>
            {b.layout !== "bar" && purposes.data ? (
              <ul className="flex flex-col gap-1 text-body-sm">
                {purposes.data.items.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span>{p.name}</span>
                    <input type="checkbox" aria-label={p.name} disabled={p.mandatory} checked={p.mandatory} readOnly />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button size="sm">{copy.acceptLabel}</Button>
              <Button size="sm">{copy.rejectLabel}</Button>
              <Button size="sm" variant="ghost">{copy.customiseLabel}</Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function Page() {
  const { t } = useTranslation();
  const query = useBanner();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.banner")} lead={t("screens.banner.lead")} featureIds="CFG-03 · COL-02" />
      <QueryView query={query}>
        {(d) => (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label={t("screens.banner.impressions")} value={formatNumber(d.impressions7d)} />
              <Stat label={t("screens.banner.acceptRate")} value={`${formatNumber(d.acceptRate7d)}%`} />
              <Stat label={t("screens.banner.languages")} value={d.languages.join(" · ")} />
            </div>
            <Designer initial={d} />
          </>
        )}
      </QueryView>
    </div>
  );
}
