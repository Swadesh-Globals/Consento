"use client";

import { cn } from "@consent/ui";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { searchableRoutes } from "@/lib/nav";

/** Header search: jumps to any console page the role can open. AI button is a P0 placeholder. */
export function GlobalSearch({ routes }: { routes: ReturnType<typeof searchableRoutes> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);

  const items = useMemo(
    () => routes.map((i) => ({ href: i.href, label: t(i.labelKey), section: t(i.sectionKey) })),
    [routes, t],
  );
  const term = q.trim().toLowerCase();
  const matches = term ? items.filter((i) => i.label.toLowerCase().includes(term) || i.section.toLowerCase().includes(term)).slice(0, 8) : [];

  const go = (href: string) => {
    router.push(href);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center rounded-md border border-border-strong bg-surface focus-within:outline-2 focus-within:outline-focus-ring">
        <svg aria-hidden viewBox="0 0 24 24" className="ml-2 size-[14px] shrink-0 text-text-muted" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t("common.search.label")}
          placeholder={t("common.search.placeholder")}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && matches[active]) go(matches[active].href);
            if (e.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent px-1.5 py-0.5 text-body-sm text-text outline-none placeholder:text-text-muted"
        />
        <button
          type="button"
          aria-label={t("common.search.ai")}
          aria-expanded={aiOpen}
          title={t("common.search.ai")}
          onClick={() => setAiOpen((v) => !v)}
          className="mr-0.5 flex size-[24px] shrink-0 items-center justify-center rounded-md text-accent hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
            <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
            <path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
          </svg>
        </button>
      </div>

      {open && term ? (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-body-sm text-text-muted">{t("common.search.noResults")}</li>
          ) : (
            matches.map((m, i) => (
              <li
                key={m.href}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); go(m.href); }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-body-sm", i === active && "bg-surface-tint")}
              >
                <span className="text-text">{m.label}</span>
                <span className="text-text-muted">{m.section}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {aiOpen ? (
        <div role="status" className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-border bg-surface p-4 text-body-sm shadow-md">
          <p className="text-label text-text">{t("common.search.ai")}</p>
          <p className="text-text-muted">{t("common.search.aiSoon")}</p>
        </div>
      ) : null}
    </div>
  );
}
