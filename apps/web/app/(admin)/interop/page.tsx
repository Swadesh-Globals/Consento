"use client";

import { useTranslation } from "react-i18next";
import { DataTable, PageHeader, Panel, QueryView, Status, useInterop } from "@/features/workspace";

export default function Page() {
  const { t } = useTranslation();
  const query = useInterop();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.admin.interop")} lead={t("screens.interop.lead")} featureIds="INT-06" />
      <QueryView query={query}>
        {(d) => (
          <>
            <p className="text-body-sm text-text-muted">{t("screens.interop.version")}: {d.apiVersion}</p>
            <Panel title={t("screens.interop.endpoints")}>
              <DataTable
                caption={t("screens.interop.endpoints")}
                rows={d.endpoints}
                rowKey={(r) => `${r.method} ${r.path}`}
                columns={[
                  { key: "m", header: t("screens.interop.cols.method"), cell: (r) => <code>{r.method}</code> },
                  { key: "p", header: t("screens.interop.cols.path"), cell: (r) => <code>{r.path}</code> },
                  { key: "d", header: t("screens.interop.cols.description"), cell: (r) => r.description },
                  { key: "s", header: t("screens.interop.cols.status"), cell: (r) => <Status value={r.status} /> },
                ]}
              />
            </Panel>
            <Panel title={t("screens.interop.managers")}>
              <ul className="flex flex-col gap-2">
                {d.consentManagers.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-body-sm">
                    <span>{m.name}</span>
                    <Status value={m.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </QueryView>
    </div>
  );
}
