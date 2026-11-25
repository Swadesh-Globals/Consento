"use client";

import type { Session } from "@consent/schemas";
import { cn } from "@consent/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { canOpenRoute, searchableRoutes, visibleNav } from "@/lib/nav";
import { GlobalSearch } from "./global-search";
import { SidebarFooter } from "./sidebar-footer";
import { ClientLogo, DpoModeButton, MockBanner, TenantSwitcher } from "./switchers";

/**
 * Responsive console shell (frontend.md §9.1).
 * lg+ (≥1024px): fixed 240px sidebar + 3-column header with the search centred.
 * <lg: sidebar becomes an off-canvas drawer opened by the menu button; header compacts;
 * <sm (<640px): search drops to its own row under the header controls.
 */
export function ConsoleShell({ session, children }: { session: Session; children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close the drawer on navigation and on Escape.
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  if (session.kind !== "staff") return null;

  // Unified console: one shell for every staff role; each route is gated by its nav permission.
  const sections = visibleNav(session.activeRole);
  const allowed = canOpenRoute(session.activeRole, pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <MockBanner />
      <div className="flex flex-1">
        {drawer ? (
          <button
            type="button"
            aria-label={t("common.shell.closeMenu")}
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden"
          />
        ) : null}
        <aside
          id="console-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200",
            "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:shadow-none",
            drawer ? "translate-x-0 shadow-lg" : "-translate-x-full",
          )}
        >
          <Link href="/dashboard" className="block px-4 pb-5 pt-4" aria-label={t("common.app.name")}>
            <Image src="/logos/globals-logo-color.svg" alt="Globals" width={120} height={32} priority />
          </Link>
          <nav aria-label="Console" className="flex-1 overflow-y-auto px-4 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]">
            {sections.map((sec) => (
              <div key={sec.key} className="mb-5">
                <p className="mb-2 px-3 text-overline uppercase text-text-muted">{t(sec.titleKey)}</p>
                <ul className="flex flex-col gap-1">
                  {sec.items.map((i) => {
                    const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
                    return (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "block rounded-md px-3 py-2 text-label",
                            active ? "bg-surface-tint text-primary" : "text-text-muted hover:bg-surface-tint hover:text-text",
                          )}
                        >
                          {t(i.labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <SidebarFooter session={session} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "sticky top-0 z-20 grid items-center gap-x-3 gap-y-2 border-b border-border bg-surface px-4 py-2",
              "grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[1fr_minmax(0,600px)_1fr] lg:px-5",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={t("common.shell.openMenu")}
                aria-controls="console-sidebar"
                aria-expanded={drawer}
                onClick={() => setDrawer(true)}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-md text-text hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring lg:hidden"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden sm:block">
                <ClientLogo />
              </div>
            </div>
            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <GlobalSearch routes={searchableRoutes(session.activeRole)} />
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2 lg:gap-3">
              <TenantSwitcher />
              <DpoModeButton session={session} />
            </div>
          </header>
          <main id="main" className="min-w-0 flex-1 p-4 lg:p-5">
            {allowed ? (
              children
            ) : (
              <div role="alert" className="flex flex-col gap-3">
                <h1 className="text-h3 text-primary">{t("common.access.deniedTitle")}</h1>
                <p className="text-body text-text-muted">{t("common.access.deniedBody")}</p>
                <Link href="/dashboard" className="text-label text-primary underline">
                  {t("common.access.backHome")}
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
