"use client";

import type { Session } from "@consent/schemas";
import { cn } from "@consent/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSignOut } from "@/lib/auth/session";
import { canOpenRoute } from "@/lib/nav";

const iconBtn =
  "flex size-[32px] items-center justify-center rounded-md text-text-muted hover:bg-surface-tint hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/** Sidebar footer: avatar (opens account menu with sign out), help, notifications and settings. */
export function SidebarFooter({ session }: { session: Session }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const signOut = useSignOut();
  const [menu, setMenu] = useState<"account" | "help" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  const initials = session.displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const canNotify = canOpenRoute(session.activeRole, "/notifications");
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div ref={ref} className="relative flex items-center justify-between border-t border-border px-4 py-3">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu === "account"}
        aria-label={`${session.displayName} · ${t(`common.role.${session.activeRole}`)}`}
        onClick={() => setMenu(menu === "account" ? null : "account")}
        className="flex size-[32px] items-center justify-center rounded-full bg-surface-tint text-label text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        {initials}
      </button>

      <div className="flex items-center gap-1">
        <button type="button" aria-label={t("common.footer.help")} title={t("common.footer.help")} aria-expanded={menu === "help"} onClick={() => setMenu(menu === "help" ? null : "help")} className={iconBtn}>
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.2" />
            <path d="M12 17h.01" />
          </Icon>
        </button>
        {canNotify ? (
          <Link href="/notifications" aria-label={t("nav.platform.notifications")} title={t("nav.platform.notifications")} aria-current={active("/notifications") ? "page" : undefined} className={cn(iconBtn, active("/notifications") && "bg-surface-tint text-primary")}>
            <Icon>
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </Icon>
          </Link>
        ) : null}
        <Link href="/settings" aria-label={t("common.actions.settings")} title={t("common.actions.settings")} aria-current={active("/settings") ? "page" : undefined} className={cn(iconBtn, active("/settings") && "bg-surface-tint text-primary")}>
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </Icon>
        </Link>
      </div>

      {menu === "account" ? (
        <div role="menu" className="absolute bottom-full left-3 z-20 mb-2 w-52 rounded-lg border border-border bg-surface p-2 shadow-md">
          <div className="px-2 py-1">
            <p className="truncate text-label text-text">{session.displayName}</p>
            <p className="text-body-sm text-text-muted">{t(`common.role.${session.activeRole}`)}</p>
          </div>
          <hr className="my-1 border-border" />
          <button
            type="button"
            role="menuitem"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: () => router.replace("/login") })}
            className="w-full rounded-md px-2 py-1 text-left text-label text-danger hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {t("common.actions.signOut")}
          </button>
        </div>
      ) : null}

      {menu === "help" ? (
        <div role="status" className="absolute bottom-full left-3 right-3 z-20 mb-2 rounded-lg border border-border bg-surface p-3 text-body-sm shadow-md">
          <p className="text-label text-text">{t("common.footer.help")}</p>
          <p className="text-text-muted">{t("common.footer.helpBody")}</p>
        </div>
      ) : null}
    </div>
  );
}
