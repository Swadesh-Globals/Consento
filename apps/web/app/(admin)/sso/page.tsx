"use client";

import { useTranslation } from "react-i18next";
import { PageHeader, Panel, QueryView, Stat, Status, useSso } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useSso();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.sso")} lead={t("screens.sso.lead")} featureIds="CFG-13" />
      <QueryView query={query}>
        {(s) => (
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title={t("nav.admin.sso")}>
              <Status value={s.status} />
              <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-2">
                <dt className="text-text-muted">{t("screens.sso.protocol")}</dt><dd>{s.protocol.toUpperCase()}</dd>
                <dt className="text-text-muted">{t("screens.sso.idp")}</dt><dd>{s.idp || "—"}</dd>
                <dt className="text-text-muted">{t("screens.sso.enforced")}</dt><dd>{t(s.enforced ? "screens.common.yes" : "screens.common.no")}</dd>
              </dl>
            </Panel>
            <Panel title={t("screens.sso.scim")}>
              <Status value={s.scim.enabled ? "active" : "not_configured"} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat label={t("screens.sso.users")} value={s.scim.usersProvisioned} />
                <Stat label={t("screens.sso.groups")} value={s.scim.groupsMapped} />
                <Stat label={t("screens.sso.lastSync")} value={<span className="text-body-sm">{s.scim.lastSyncAt ? formatDateTime(s.scim.lastSyncAt) : t("screens.common.never")}</span>} />
              </div>
            </Panel>
          </div>
        )}
      </QueryView>
    </div>
  );
}
