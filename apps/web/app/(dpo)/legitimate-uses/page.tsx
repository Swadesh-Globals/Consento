"use client";

import { Card } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { PageHeader, QueryView, useLegitimateUses } from "@/features/workspace";
import { formatDate } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useLegitimateUses();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.legitimateUses")} lead={t("screens.legitimateUses.lead")} featureIds="CFG-08" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <div className="grid gap-5 xl:grid-cols-2">
            {d.items.map((u) => (
              <Card key={u.id}>
                <article className="flex flex-col gap-3">
                  <p className="text-overline uppercase text-text-muted">{u.section}</p>
                  <h2 className="text-h4">{u.name}</h2>
                  <p className="text-body text-text-muted">{u.justification}</p>
                  <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
                    <dt className="text-text-muted">{t("screens.legitimateUses.data")}</dt><dd>{u.dataCategories.join(", ")}</dd>
                    <dt className="text-text-muted">{t("screens.legitimateUses.systems")}</dt><dd>{u.systems.join(", ")}</dd>
                    <dt className="text-text-muted">{t("screens.legitimateUses.owner")}</dt><dd>{u.owner}</dd>
                    <dt className="text-text-muted">{t("screens.legitimateUses.reviewed")}</dt><dd>{formatDate(u.reviewedAt)}</dd>
                  </dl>
                </article>
              </Card>
            ))}
          </div>
        )}
      </QueryView>
    </div>
  );
}
