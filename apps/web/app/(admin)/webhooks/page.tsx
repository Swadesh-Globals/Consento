"use client";

import { Button, StatusBadge } from "@consent/ui";
import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, Panel, QueryView, Status, useReplayDelivery, useWebhooks } from "@/features/workspace";
import { formatDateTime, formatNumber } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useWebhooks();
  const replay = useReplayDelivery();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.webhooks")} lead={t("screens.webhooks.lead")} featureIds="CFG-06 · INT-02" />
      <QueryView query={query} isEmpty={(d) => d.endpoints.length === 0}>
        {(d) => {
          const urlOf = new Map(d.endpoints.map((e) => [e.id, e.url]));
          return (
            <>
              <Panel title={t("screens.webhooks.endpoints")}>
                <DataTable
                  caption={t("screens.webhooks.endpoints")}
                  rows={d.endpoints}
                  rowKey={(r) => r.id}
                  columns={[
                    { key: "u", header: t("screens.webhooks.ecols.url"), cell: (r) => <code>{r.url}</code> },
                    { key: "e", header: t("screens.webhooks.ecols.events"), cell: (r) => r.events.join(", ") },
                    { key: "s", header: t("screens.webhooks.ecols.status"), cell: (r) => <Status value={r.status} /> },
                    {
                      key: "r",
                      header: t("screens.webhooks.ecols.rate"),
                      cell: (r) =>
                        r.successRate7d === null ? "—" : <StatusBadge tone={r.successRate7d >= 95 ? "success" : "warning"} label={`${formatNumber(r.successRate7d)}%`} />,
                    },
                    { key: "l", header: t("screens.webhooks.ecols.last"), cell: (r) => (r.lastDeliveryAt ? formatDateTime(r.lastDeliveryAt) : t("screens.common.never")) },
                  ]}
                />
              </Panel>
              <Panel title={t("screens.webhooks.log")}>
                <DataTable
                  caption={t("screens.webhooks.log")}
                  rows={d.deliveries}
                  rowKey={(r) => r.id}
                  columns={[
                    { key: "e", header: t("screens.webhooks.dcols.event"), cell: (r) => <><div><code>{r.event}</code></div><div className="text-text-muted">{urlOf.get(r.endpointId)}</div></> },
                    { key: "a", header: t("screens.webhooks.dcols.at"), cell: (r) => formatDateTime(r.at) },
                    { key: "h", header: t("screens.webhooks.dcols.http"), cell: (r) => r.httpStatus },
                    { key: "n", header: t("screens.webhooks.dcols.attempts"), cell: (r) => r.attempts },
                    { key: "r", header: t("screens.webhooks.dcols.result"), cell: (r) => <StatusBadge tone={r.ok ? "success" : "danger"} label={t(r.ok ? "screens.webhooks.ok" : "screens.webhooks.failed")} /> },
                    {
                      key: "x",
                      header: t("screens.webhooks.dcols.actions"),
                      cell: (r) =>
                        r.ok ? null : (
                          <Button size="sm" variant="ghost" disabled={replay.isPending} onClick={() => replay.mutate(r.id)}>
                            {t("screens.webhooks.replay")}
                          </Button>
                        ),
                    },
                  ]}
                />
              </Panel>
            </>
          );
        }}
      </QueryView>
    </div>
  );
}
