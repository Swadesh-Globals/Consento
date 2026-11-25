"use client";

import type { ReactNode } from "react";
import { useSession } from "./auth/session";
import { roleHas, type Permission } from "./permissions";

export { roleHas, type Permission } from "./permissions";

/** UI visibility only — the backend re-checks every action (frontend.md §6.3). Uses the session's active role. */
export function usePermission(permission: Permission): boolean {
  const { data } = useSession();
  return data?.kind === "staff" && roleHas(data.activeRole, permission);
}

export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  return usePermission(permission) ? children : null;
}
