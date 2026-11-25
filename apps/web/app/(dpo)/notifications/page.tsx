"use client";

import { Button, StatusBadge, cn } from "@consent/ui";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PageHeader, QueryView, Status, useMarkAllRead, useNotifications } from "@/features/workspace";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t } = useTranslation();
  const query = useNotifications();
  const markAll = useMarkAllRead();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.platform.notifications")}
        lead={t("screens.notifications.lead")}
        featureIds="PLT-01"
        action={<Button variant="ghost" disabled={markAll.isPending} onClick={() => markAll.mutate()}>{t("screens.notifications.markAll")}</Button>}
      />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <ul className="flex flex-col gap-3">
            {d.items.map((n) => (
              <li key={n.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4", !n.read && { critical: "border-l-4 border-l-danger", high: "border-l-4 border-l-danger", medium: "border-l-4 border-l-warning", low: "border-l-4 border-l-primary" }[n.severity])}>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Status value={n.severity} />
                    <StatusBadge tone="neutral" label={t(`screens.notifications.channel.${n.channel}`)} />
                    {!n.read ? <StatusBadge tone="info" label={t("screens.notifications.unread")} /> : null}
                  </div>
                  <Link href={n.link} className="text-body text-primary hover:underline">{n.title}</Link>
                </div>
                <span className="text-body-sm text-text-muted">{formatDateTime(n.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </div>
  );
}
