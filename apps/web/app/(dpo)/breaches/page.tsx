"use client";

import type { Breach } from "@consent/schemas";
import { Button, Card, ConfirmDialog, StatusBadge, cn } from "@consent/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader, QueryView, Status, useBreaches, useNotifyBreach } from "@/features/workspace";
import { formatDateTime, formatNumber } from "@/lib/format";

const STEPS = ["assess", "board", "principals", "send"] as const;

function Wizard({ breach }: { breach: Breach }) {
  const { t } = useTranslation();
  const notify = useNotifyBreach();
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <h3 className="text-label">{t("screens.breaches.wizard")}</h3>
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={cn("rounded-sm px-2 text-label", i === step ? "bg-primary text-on-primary" : i < step ? "bg-success-fill text-success" : "bg-surface-tint text-text-muted")}>
            {i + 1}. {t(`screens.breaches.steps.${s}`)}
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        {step < STEPS.length - 1 ? (
          <Button size="sm" variant="ghost" onClick={() => setStep(step + 1)}>{t("screens.breaches.next")}</Button>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>{t("screens.breaches.notify")}</Button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title={t("screens.breaches.notifyTitle")}
        consequence={t("screens.breaches.notifyConfirm")}
        confirmLabel={t("screens.breaches.notify")}
        cancelLabel={t("common.actions.cancel")}
        pending={notify.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => notify.mutate(breach.id, { onSettled: () => setConfirm(false) })}
      />
    </div>
  );
}

function Deadline({ breach }: { breach: Breach }) {
  const { t } = useTranslation();
  if (breach.boardNotifiedAt) return <StatusBadge tone="success" label={`${t("screens.breaches.board")}: ${formatDateTime(breach.boardNotifiedAt)}`} />;
  const hours = Math.floor((Date.parse(breach.boardDeadlineAt) - Date.now()) / 3_600_000);
  return hours < 0 ? (
    <StatusBadge tone="danger" label={t("screens.breaches.passed")} />
  ) : (
    <StatusBadge tone={hours < 24 ? "danger" : "warning"} label={t("screens.breaches.left", { hours })} />
  );
}

export default function Page() {
  const { t } = useTranslation();
  const query = useBreaches();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.dpo.breaches")} lead={t("screens.breaches.lead")} featureIds="DPO-06" />
      <QueryView query={query} isEmpty={(d) => d.items.length === 0}>
        {(d) => (
          <div className="grid gap-5 xl:grid-cols-2">
            {d.items.map((b) => (
              <Card key={b.id}>
                <article className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Status value={b.severity} />
                    <Status value={b.status} />
                    <Deadline breach={b} />
                  </div>
                  <h2 className="text-h4">{b.title}</h2>
                  <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
                    <dt className="text-text-muted">{t("screens.breaches.detected")}</dt>
                    <dd>{formatDateTime(b.detectedAt)}</dd>
                    <dt className="text-text-muted">{t("screens.breaches.deadline")}</dt>
                    <dd>{formatDateTime(b.boardDeadlineAt)}</dd>
                    <dt className="text-text-muted">{t("screens.breaches.categories")}</dt>
                    <dd>{b.dataCategories.join(", ")}</dd>
                    <dt className="text-text-muted">{t("screens.breaches.principals")}</dt>
                    <dd>{b.principalsNotifiedAt ? formatDateTime(b.principalsNotifiedAt) : "—"}</dd>
                  </dl>
                  <p className="text-body">{t("screens.breaches.affected", { count: formatNumber(b.principalsAffected) })}</p>
                  <details className="rounded-md border border-border p-3">
                    <summary className="cursor-pointer text-label">{t("screens.breaches.timeline")}</summary>
                    <ol className="mt-3 flex flex-col gap-2 border-l border-border pl-4">
                      {b.timeline.map((e, i) => (
                        <li key={i} className="flex flex-col text-body-sm">
                          <span className="text-text-muted">{formatDateTime(e.at)} · {e.actor}</span>
                          <span>{e.note}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                  <details className="rounded-md border border-border p-3">
                    <summary className="cursor-pointer text-label">{t("screens.breaches.draft")}</summary>
                    <p className="mt-3 text-body-sm">{b.principalNoticeDraft}</p>
                  </details>
                  {b.status === "open" ? <Wizard breach={b} /> : null}
                </article>
              </Card>
            ))}
          </div>
        )}
      </QueryView>
    </div>
  );
}
