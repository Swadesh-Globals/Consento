"use client";

import { StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, QueryView, Status, useBranding } from "@/features/workspace";

export default function Page() {
  const { t } = useTranslation();
  const query = useBranding();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.branding")} lead={t("screens.branding.lead")} featureIds="CFG-21 · CFG-12" />
      <QueryView query={query}>
        {(b) => (
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title={t("nav.admin.branding")}>
              <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-2">
                <dt className="text-text-muted">{t("screens.branding.name")}</dt><dd>{b.displayName}</dd>
                <dt className="text-text-muted">{t("screens.branding.logo")}</dt><dd><code>{b.logoFile}</code></dd>
                <dt className="text-text-muted">{t("screens.branding.colour")}</dt><dd>{b.primaryColour}</dd>
                <dt className="text-text-muted">{t("screens.branding.domain")}</dt>
                <dd className="flex flex-wrap items-center gap-2">{b.customDomain || "—"} <Status value={b.domainStatus} /></dd>
                <dt className="text-text-muted">{t("screens.branding.sender")}</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  {b.emailSender}
                  <StatusBadge tone={b.senderVerified ? "success" : "warning"} label={t(b.senderVerified ? "screens.branding.senderOk" : "screens.branding.senderNo")} />
                </dd>
              </dl>
            </Panel>
            <Panel title={t("screens.banner.preview")}>
              <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary text-label text-on-primary" aria-hidden>
                    {b.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-h4">{b.displayName}</span>
                </div>
                <p className="text-body-sm text-text-muted">https://{b.customDomain || "consent.example.in"}</p>
                <p className="text-body-sm">From: {b.emailSender}</p>
              </div>
            </Panel>
          </div>
        )}
      </QueryView>
    </div>
  );
}
