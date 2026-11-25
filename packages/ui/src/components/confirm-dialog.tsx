"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel,
  cancelLabel,
  pending,
  tone = "danger",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  consequence: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,480px)] rounded-xl border border-border bg-surface p-5 text-text shadow-lg backdrop:bg-navy-950/50"
    >
      <h2 id="confirm-title" className="mb-3 text-h4">
        {title}
      </h2>
      <p className="mb-4 text-body text-text-muted">{consequence}</p>
      {children}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={pending} aria-busy={pending}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
