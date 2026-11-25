"use client";

import type { Session } from "@consent/schemas";
import { LoadingState } from "@consent/ui";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/lib/auth/session";

/** Route-group guard for P0 mock mode. UX only — the API rejects unauthenticated calls regardless. */
export function RequireSession({
  kind,
  redirectTo,
  children,
}: {
  kind: Session["kind"];
  redirectTo: string;
  children: (session: Session) => ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const ok = session?.kind === kind;

  useEffect(() => {
    if (!isPending && !ok) router.replace(redirectTo);
  }, [isPending, ok, redirectTo, router]);

  if (!ok || !session) {
    return (
      <div className="p-5">
        <LoadingState label={t("common.states.loading")} rows={2} />
      </div>
    );
  }
  return <>{children(session)}</>;
}
