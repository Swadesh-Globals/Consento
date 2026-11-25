"use client";

import { Card, EmptyState, ErrorState, Skeleton } from "@consent/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/lib/api-client";

/** Presentational state for one Overview block, so every state can be rendered in Storybook without a network. */
export type BlockView<T> =
  | { status: "pending" }
  | { status: "error"; requestId?: string | undefined; onRetry: () => void }
  | { status: "success"; data: T };

export function toView<T>(query: UseQueryResult<T>): BlockView<T> {
  if (query.isPending) return { status: "pending" };
  if (query.isError) {
    return {
      status: "error",
      requestId: query.error instanceof ApiRequestError ? query.error.requestId : undefined,
      onRetry: () => void query.refetch(),
    };
  }
  return { status: "success", data: query.data };
}

export interface BlockProps<T> {
  id: string;
  title: string;
  view: BlockView<T>;
  isEmpty: (data: T) => boolean;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: ReactNode;
  headerAction?: ReactNode;
  skeleton?: ReactNode;
  className?: string;
  children: (data: T) => ReactNode;
}

/** Card with a heading and the four required data states: loading, empty, error, success (frontend.md §9). */
export function Block<T>({
  id,
  title,
  view,
  isEmpty,
  emptyTitle,
  emptyBody,
  emptyAction,
  headerAction,
  skeleton,
  className,
  children,
}: BlockProps<T>) {
  const { t } = useTranslation();
  const headingId = `${id}-title`;
  let body: ReactNode;
  if (view.status === "pending") {
    body = (
      <div role="status" aria-label={t("common.states.loading")} aria-busy="true">
        {skeleton ?? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        )}
      </div>
    );
  } else if (view.status === "error") {
    body = (
      <ErrorState
        title={t("common.states.errorTitle")}
        message={t("common.states.errorBody")}
        requestId={view.requestId}
        retryLabel={t("common.actions.retry")}
        onRetry={view.onRetry}
      />
    );
  } else if (isEmpty(view.data)) {
    body = <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />;
  } else {
    body = children(view.data);
  }

  return (
    <Card className={className}>
      <section aria-labelledby={headingId} className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={headingId} className="text-h4 text-text">
            {title}
          </h2>
          {headerAction}
        </div>
        {body}
      </section>
    </Card>
  );
}
