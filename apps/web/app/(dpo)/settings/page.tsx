"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel } from "@/features/workspace";
import { useSession } from "@/lib/auth/session";
import { visibleSettings } from "@/lib/nav";

/** Settings hub (gear icon): account details plus set-once admin pages grouped by topic (lib/nav.ts settingsGroups). */
export default function Page() {
  const { t } = useTranslation();
  const session = useSession().data;
  if (!session) return null;
  const groups = visibleSettings(session.activeRole);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("common.actions.settings")} lead={t("screens.settings.lead")} featureIds="CFG · PLT" />
      <Panel title={t("screens.settings.account")}>
        <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-3">
          <div><dt className="text-text-muted">{t("screens.settings.name")}</dt><dd className="text-label">{session.displayName}</dd></div>
          <div><dt className="text-text-muted">{t("screens.settings.role")}</dt><dd className="text-label">{t(`common.role.${session.activeRole}`)}</dd></div>
          <div>
            <dt className="text-text-muted">{t("screens.settings.roles")}</dt>
            <dd className="text-label">{session.availableRoles.map((r) => t(`common.role.${r}`)).join(", ")}</dd>
          </div>
        </dl>
      </Panel>
      {groups.length === 0 ? (
        <p className="text-body-sm text-text-muted">{t("screens.settings.noAccess")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <Panel key={g.key} title={t(g.titleKey)}>
              <ul className="flex flex-col gap-2">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className="block rounded-md border border-border px-4 py-3 text-label text-primary hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      {t(i.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
