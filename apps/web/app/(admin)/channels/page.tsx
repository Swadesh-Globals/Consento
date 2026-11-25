"use client";

import { Card, StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { PageHeader, QueryView, useChannels } from "@/features/workspace";
import { formatDateTime, formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useChannels();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.channels")} lead={t("screens.channels.lead")} featureIds="CFG-18 · COL-01–COL-04 · COL-06" />
      <QueryView query={query}>
        {(d) => (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {d.items.map((c) => (
              <Card key={c.key}>
                <article className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-h4">{t(`screens.channels.key.${c.key}`)}</h2>
                    <StatusBadge tone={c.enabled ? "success" : "neutral"} label={t(c.enabled ? "screens.channels.enabled" : "screens.channels.disabled")} />
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
                    <dt className="text-text-muted">{t("screens.channels.consents")}</dt><dd>{formatNumber(c.consents30d)}</dd>
                    <dt className="text-text-muted">{t("screens.channels.attestation")}</dt><dd>{t(c.attestationRequired ? "screens.common.yes" : "screens.common.no")}</dd>
                    <dt className="text-text-muted">{t("screens.channels.last")}</dt><dd>{c.lastCaptureAt ? formatDateTime(c.lastCaptureAt) : t("screens.common.never")}</dd>
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
