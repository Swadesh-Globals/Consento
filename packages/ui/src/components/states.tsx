import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-tint", className)} />;
}

export function LoadingState({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong p-5">
      <h3 className="text-h4">{title}</h3>
      <p className="text-body text-text-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  requestId,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  requestId?: string | undefined;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger-fill p-5">
      <h3 className="text-h4 text-danger">{title}</h3>
      <p className="text-body text-text">{message}</p>
      {requestId ? <p className="text-body-sm text-text-muted">Request ID: {requestId}</p> : null}
      <Button variant="ghost" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
