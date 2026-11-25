"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TENANT_COOKIE } from "../config";
import { writeCookie } from "../cookies";

interface TenantContextValue {
  slug: string;
  setSlug: (slug: string) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const DEFAULT_TENANT = "globals-inc";

/** P0: tenant chosen from a switcher (frontend.md §5). P1 moves this to host-based resolution in proxy.ts. */
export function TenantProvider({ initialSlug, children }: { initialSlug: string; children: ReactNode }) {
  const [slug, setSlugState] = useState(initialSlug);
  const qc = useQueryClient();

  const setSlug = useCallback(
    (next: string) => {
      writeCookie(TENANT_COOKIE, next);
      setSlugState(next);
      // Drop everything cached for other tenants so nothing leaks across.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === "tenant" && q.queryKey[1] !== next });
    },
    [qc],
  );

  const value = useMemo(() => ({ slug, setSlug }), [slug, setSlug]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
}
