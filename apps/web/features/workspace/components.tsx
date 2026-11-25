"use client";

import { Card, EmptyState, ErrorState, LoadingState, StatusBadge, cn, type BadgeTone } from "@consent/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/lib/api-client";
import { useLanguagePacks } from "./api";

export function PageHeader({ title, lead, featureIds, action }: { title: string; lead: string; featureIds: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-overline uppercase text-text-muted">{featureIds}</p>
        <h1 className="text-h2 text-primary">{title}</h1>
        <p className="text-body text-text-muted">{lead}</p>
      </div>
      {action}
    </header>
  );
}

/** Loading, error, empty and success states for one query (frontend.md §9). */
export function QueryView<T>({
  query,
  isEmpty,
  children,
}: {
  query: UseQueryResult<T>;
  isEmpty?: (d: T) => boolean;
  children: (d: T) => ReactNode;
}) {
  const { t } = useTranslation();
  if (query.isPending) return <LoadingState label={t("common.states.loading")} rows={4} />;
  if (query.isError)
    return (
      <ErrorState
        title={t("common.states.errorTitle")}
        message={t("common.states.errorBody")}
        requestId={query.error instanceof ApiRequestError ? query.error.requestId : undefined}
        retryLabel={t("common.actions.retry")}
        onRetry={() => void query.refetch()}
      />
    );
  if (isEmpty?.(query.data)) return <EmptyState title={t("screens.common.noResultsTitle")} body={t("screens.common.noResultsBody")} />;
  return <>{children(query.data)}</>;
}

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  selectedKey,
  onSelect,
}: {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  selectedKey?: string | null;
  onSelect?: (r: T) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-left text-body-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-tint">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="px-4 py-3 text-label text-text">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const k = rowKey(r);
            return (
              <tr
                key={k}
                onClick={onSelect ? () => onSelect(r) : undefined}
                onKeyDown={onSelect ? (e) => (e.key === "Enter" || e.key === " ") && onSelect(r) : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-selected={onSelect ? selectedKey === k : undefined}
                className={cn(
                  "border-t border-border",
                  onSelect && "cursor-pointer hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring",
                  selectedKey === k && "bg-surface-tint",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-top", c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const tones: Record<string, BadgeTone> = {
  submitted: "info", in_progress: "warning", completed: "success", rejected: "neutral",
  open: "warning", escalated: "danger", resolved: "success", notified: "success", closed: "neutral",
  granted: "success", denied: "neutral", withdrawn: "danger", expired: "neutral", requested: "info", renewed: "success",
  draft: "neutral", pending_approval: "warning", published: "success", active: "success",
  invited: "info", suspended: "danger", revoked: "neutral", paused: "warning",
  pending: "warning", approved: "success", generating: "info", ready: "success",
  critical: "danger", high: "danger", medium: "warning", low: "neutral",
  confirmed: "success", failed: "danger", verified: "success",
  notice_pending: "info", notice_sent: "warning", erased: "success", held: "neutral",
  signed: "success", in_review: "warning", missing: "neutral",
  planned: "info", testing: "warning", not_configured: "neutral", connected: "success", not_connected: "neutral",
  available: "success", pending_dns: "warning", not_set: "neutral", running: "info", not_started: "neutral",
};

export function Status({ value }: { value: string }) {
  const { t } = useTranslation();
  return <StatusBadge tone={tones[value] ?? "neutral"} label={t(`screens.status.${value}`)} />;
}

const DAY = 86_400_000;
/** SLA countdown in words + badge tone; never colour alone. */
export function Due({ iso, done }: { iso: string; done?: boolean }) {
  const { t } = useTranslation();
  if (done) return <span className="text-text-muted">—</span>;
  const days = Math.ceil((Date.parse(iso) - Date.now()) / DAY);
  if (days < 0) return <StatusBadge tone="danger" label={t("screens.common.overdue", { days: Math.abs(days) })} />;
  return <StatusBadge tone={days <= 2 ? "warning" : "success"} label={t("screens.common.dueIn", { days })} />;
}

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <section className="flex flex-col gap-4">
        <h2 className="text-h4">{title}</h2>
        {children}
      </section>
    </Card>
  );
}

const statTone: Record<BadgeTone, string> = {
  success: "border-l-4 border-l-success [&>span:last-child]:text-success",
  warning: "border-l-4 border-l-warning [&>span:last-child]:text-warning",
  danger: "border-l-4 border-l-danger [&>span:last-child]:text-danger",
  info: "border-l-4 border-l-accent",
  neutral: "",
};

/** Metric tile. `tone` marks a state (SLA bucket, limit reached); plain tiles stay navy. */
export function Stat({ label, value, tone = "neutral" }: { label: string; value: ReactNode; tone?: BadgeTone }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-md border border-border p-4", statTone[tone])}>
      <span className="text-label text-text-muted">{label}</span>
      <span className="text-h4 text-primary">{value}</span>
    </div>
  );
}

/** Progress bar with a state tone. Width is the only visual; the caller renders the number in text. */
export function Progress({ pct, tone = "neutral", className }: { pct: number; tone?: BadgeTone; className?: string }) {
  const fill = { success: "bg-chart-positive", warning: "bg-chart-caution", danger: "bg-chart-negative", info: "bg-accent", neutral: "bg-primary" }[tone];
  return (
    <span className={cn("block h-2 w-full overflow-hidden rounded-full bg-surface-tint", className)} aria-hidden>
      <span className={cn("block h-full", fill)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  );
}

/** RAG tone for "used of limit" meters: ≥ 95 % danger, ≥ 80 % warning, else success. */
export function limitTone(pct: number): BadgeTone {
  return pct >= 95 ? "danger" : pct >= 80 ? "warning" : "success";
}

/** Picks a language pack that has principal-facing content (CFG-11). Used by notices, banner and language packs. */
export function LanguagePicker({ value, onChange, all = false }: { value: string; onChange: (code: string) => void; all?: boolean }) {
  const { t } = useTranslation();
  const packs = useLanguagePacks();
  const options = (packs.data?.items ?? [])
    .filter((p) => all || p.notice !== "missing")
    .map((p) => ({ code: p.code, name: p.banner === "missing" ? t("screens.languages.notAddedOption", { name: p.name }) : p.name }));
  return (
    <label className="flex items-center gap-2 text-label text-text-muted">
      {t("screens.languages.previewIn")}
      <select
        className="rounded-md border border-border-strong bg-surface px-3 py-1 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options.length ? options : [{ code: "en", name: "English" }]).map((p) => (
          <option key={p.code} value={p.code}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}
