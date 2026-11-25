"use client";

import { StatusBadge } from "@consent/ui";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Progress, QueryView, useOnboarding } from "@/features/workspace";

export default function Page() {
  const { t } = useTranslation();
  const query = useOnboarding();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.onboarding")} lead={t("screens.onboarding.lead")} featureIds="Onboarding wizard" />
      <QueryView query={query}>
        {(d) => {
          const done = d.steps.filter((s) => s.done).length;
          return (
            <div className="grid gap-5 xl:grid-cols-3">
              <Panel title={t("screens.onboarding.org")}>
                <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-2">
                  <dt className="text-text-muted">{t("screens.onboarding.name")}</dt><dd>{d.organisation.name}</dd>
                  <dt className="text-text-muted">{t("screens.onboarding.dpo")}</dt><dd>{d.organisation.dpoEmail}</dd>
                  <dt className="text-text-muted">{t("screens.onboarding.sector")}</dt><dd>{d.organisation.sector}</dd>
                  <dt className="text-text-muted">{t("screens.onboarding.region")}</dt><dd>{d.organisation.region}</dd>
                </dl>
              </Panel>
              <Panel title={t("screens.onboarding.progress", { done, total: d.steps.length })} className="xl:col-span-2">
                <Progress pct={(done / d.steps.length) * 100} tone={done === d.steps.length ? "success" : "warning"} />
                <ol className="flex flex-col divide-y divide-border">
                  {d.steps.map((s, i) => (
                    <li key={s.key} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-body">{i + 1}. {t(`screens.onboarding.steps.${s.key}`)}</span>
                      <span className="flex items-center gap-3">
                        <StatusBadge tone={s.done ? "success" : "warning"} label={t(s.done ? "screens.onboarding.done" : "screens.onboarding.todo")} />
                        <Link href={s.link} className="text-label text-primary hover:underline">{t("screens.onboarding.open")}</Link>
                      </span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
          );
        }}
      </QueryView>
    </div>
  );
}
