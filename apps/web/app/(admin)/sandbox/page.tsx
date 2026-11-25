"use client";

import { Button } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, QueryView, Stat, Status, useResetSandbox, useSandbox } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useSandbox();
  const reset = useResetSandbox();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.platform.sandbox")} lead={t("screens.sandbox.lead")} featureIds="PLT-02" />
      <QueryView query={query}>
        {(s) => (
          <Panel title={s.slug}>
            <Status value={s.enabled ? "active" : "not_configured"} />
            <div className="grid gap-3 md:grid-cols-4">
              <Stat label={t("screens.sandbox.principals")} value={s.seededPrincipals} />
              <Stat label={t("screens.sandbox.key")} value={<code className="text-body-sm">{s.apiKeyPrefix ?? "—"}</code>} />
              <Stat label={t("screens.sandbox.lastReset")} value={<span className="text-body-sm">{s.lastResetAt ? formatDateTime(s.lastResetAt) : "—"}</span>} />
              <Stat label={t("screens.sandbox.live")} value={<span className="text-body-sm">{s.liveSince ? formatDateTime(s.liveSince) : t("screens.sandbox.notLive")}</span>} />
            </div>
            <div>
              <Button variant="ghost" disabled={reset.isPending} onClick={() => reset.mutate()}>{t("screens.sandbox.reset")}</Button>
            </div>
          </Panel>
        )}
      </QueryView>
    </div>
  );
}
