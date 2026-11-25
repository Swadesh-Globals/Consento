"use client";

import { TenantList, type Session } from "@consent/schemas";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { request } from "@/lib/api-client";
import { useSwitchRole } from "@/lib/auth/session";
import { useTenant } from "@/lib/tenant/tenant-context";

const selectClass =
  "max-w-[160px] truncate rounded-md border border-border-strong bg-surface px-3 py-1 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring lg:max-w-none";

export function TenantSwitcher() {
  const { t } = useTranslation();
  const { slug, setSlug } = useTenant();
  const tenants = useQuery({ queryKey: ["tenants"], queryFn: () => request(TenantList, "/tenants") });

  return (
    <label className="flex items-center text-label text-text-muted">
      <span className="sr-only">{t("common.tenant.label")}</span>
      <select className={selectClass} value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!tenants.data}>
        {(tenants.data?.items ?? [{ slug, name: slug }]).map((x) => (
          <option key={x.slug} value={x.slug}>
            {x.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MockBanner() {
  const { t } = useTranslation();
  return (
    <div className="bg-secondary px-4 py-1 text-center text-body-sm text-on-secondary">{t("common.mockBanner")}</div>
  );
}

/** Client (tenant) logo slot in the header. Shows a placeholder until the tenant uploads a logo in Branding. */
export function ClientLogo() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const tenants = useQuery({ queryKey: ["tenants"], queryFn: () => request(TenantList, "/tenants") });
  const tenant = tenants.data?.items.find((x) => x.slug === slug);
  if (tenant?.logoUrl) {
    return <Image src={tenant.logoUrl} alt={tenant.name} width={150} height={40} unoptimized className="h-[32px] w-[120px] object-contain lg:h-[40px] lg:w-[150px]" />;
  }
  return (
    <div
      role="img"
      aria-label={t("common.clientLogo.placeholder", { name: tenant?.name ?? slug })}
      className="flex h-[32px] w-[120px] lg:h-[40px] lg:w-[150px] items-center justify-center rounded-md border border-dashed border-border-strong bg-background px-2 text-body-sm text-text-muted"
    >
      <span className="truncate">{tenant?.name ?? t("common.clientLogo.label")}</span>
    </div>
  );
}

/**
 * DPO workspace toggle: switches the session's active role to `dpo` so the console shows only DPO operations
 * (rights, grievances, breaches, compliance). Shown only when the account holds the dpo role plus another role.
 */
export function DpoModeButton({ session }: { session: Session }) {
  const { t } = useTranslation();
  const router = useRouter();
  const switchRole = useSwitchRole();
  const other = session.availableRoles.find((r) => r !== "dpo");
  if (!session.availableRoles.includes("dpo") || !other) return null;
  const on = session.activeRole === "dpo";
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={switchRole.isPending}
      title={on ? t("common.dpoMode.exit") : t("common.dpoMode.enter")}
      onClick={() => switchRole.mutate(on ? other : "dpo", { onSuccess: () => router.push("/dashboard") })}
      className={
        on
          ? "rounded-md border border-primary bg-primary px-3 py-1 text-label text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
          : "rounded-md border border-primary px-3 py-1 text-label text-primary hover:bg-surface-tint focus-visible:outline-2 focus-visible:outline-focus-ring"
      }
    >
      {on ? t("common.dpoMode.exitShort") : t("common.dpoMode.label")}
    </button>
  );
}
