"use client";

import { Button, Card, ConfirmDialog } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader, QueryView, Status, useDecideSupport, useSupportRequests } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useSupportRequests();
  const decide = useDecideSupport();
  const [approving, setApproving] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.supportAccess")} lead={t("screens.support.lead")} featureIds="CFG-14" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <div className="grid gap-5 xl:grid-cols-2">
            {[...d.items].sort((a, b) => Number(a.status !== "pending") - Number(b.status !== "pending")).map((r) => (
              <Card key={r.id}>
                <article className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-h4">{r.requestedBy}</h2>
                    <Status value={r.status} />
                  </div>
                  <p className="text-body">{r.reason}</p>
                  <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
                    <dt className="text-text-muted">{t("screens.support.scope")}</dt><dd>{r.scope}</dd>
                    <dt className="text-text-muted">{t("screens.support.requested")}</dt><dd>{formatDateTime(r.requestedAt)} · {t("screens.support.duration", { hours: r.durationHours })}</dd>
                    {r.expiresAt ? (<><dt className="text-text-muted">{t("screens.support.expires")}</dt><dd>{formatDateTime(r.expiresAt)}</dd></>) : null}
                  </dl>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setApproving(r.id)}>{t("screens.support.approve")}</Button>
                      <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, decision: "denied" })}>
                        {t("screens.support.deny")}
                      </Button>
                    </div>
                  ) : null}
                </article>
              </Card>
            ))}
          </div>
        )}
      </QueryView>
      <ConfirmDialog
        open={approving !== null}
        title={t("screens.support.approveTitle")}
        consequence={t("screens.support.approveConfirm")}
        confirmLabel={t("screens.support.approve")}
        cancelLabel={t("common.actions.cancel")}
        tone="primary"
        pending={decide.isPending}
        onCancel={() => setApproving(null)}
        onConfirm={() => approving && decide.mutate({ id: approving, decision: "approved" }, { onSettled: () => setApproving(null) })}
      />
    </div>
  );
}
