import { cn } from "../lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const toneClass: Record<BadgeTone, string> = {
  success: "bg-success-fill text-success",
  warning: "bg-warning-fill text-warning",
  danger: "bg-danger-fill text-danger",
  neutral: "bg-surface-tint text-text-muted",
  info: "bg-secondary text-on-secondary",
};

/** Status is never conveyed by colour alone: the label is always rendered. */
export function StatusBadge({ tone, label }: { tone: BadgeTone; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-sm px-2 text-label font-semibold", toneClass[tone])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
