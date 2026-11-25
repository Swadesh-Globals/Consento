"use client";

import { StaffLoginRequest } from "@consent/schemas";
import { Button, Card } from "@consent/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MockBanner } from "@/components/shell/switchers";
import { ApiRequestError } from "@/lib/api-client";
import { useStaffLogin } from "@/lib/auth/session";

const demoAccounts = ["admin@example.in", "dpo@example.in", "operator@example.in", "viewer@example.in"];

/** Staff sign-in: role is resolved from the account (RBAC), not picked. P0 mock; Better Auth + MFA in P1. */
export default function StaffLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useStaffLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <MockBanner />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-8">
        <h1 className="text-h2 text-primary">{t("auth.staff.title")}</h1>
        <p className="text-body text-text-muted">{t("auth.staff.body")}</p>
        <Card>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = StaffLoginRequest.safeParse({ email, password });
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message ?? "Check the details and try again");
                return;
              }
              setError(null);
              login.mutate(parsed.data, {
                onSuccess: () => router.replace("/dashboard"),
                onError: (err) =>
                  setError(err instanceof ApiRequestError ? err.message : "Sign-in failed. Try again."),
              });
            }}
          >
            <label className="flex flex-col gap-2">
              <span className="text-label">{t("auth.staff.emailLabel")}</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? "login-error" : undefined}
                className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-label">{t("auth.staff.passwordLabel")}</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={error ? "login-error" : undefined}
                className="rounded-md border border-border-strong bg-surface px-3 py-2 text-body"
              />
            </label>
            {error && (
              <p id="login-error" role="alert" className="text-body-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              {t("auth.staff.submit")}
            </Button>
          </form>
        </Card>
        <div className="text-body-sm text-text-muted">
          <p className="mb-2">{t("auth.staff.demoHint")}</p>
          <ul className="flex flex-col gap-1">
            {demoAccounts.map((a) => (
              <li key={a}>
                <button type="button" className="text-primary underline" onClick={() => setEmail(a)}>
                  {a}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
