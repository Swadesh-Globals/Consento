import type { StaffRole } from "@consent/schemas";

/** Pure role → permission matrix (frontend.md §6.3). UI visibility only — the backend re-checks every action. */
export type Permission =
  | "workspace.configure"
  | "config.manage"
  | "integrations.manage"
  | "supportAccess.approve"
  | "dashboard.view"
  | "principal.lookup"
  | "dsr.work"
  | "grievance.work"
  | "breach.manage"
  | "audit.export"
  | "compliance.view";

const matrix: Record<StaffRole, readonly Permission[]> = {
  // Admin sees everything (no friction or blind spots). The DPO button narrows the console to DPO work only.
  admin: [
    "workspace.configure",
    "config.manage",
    "integrations.manage",
    "supportAccess.approve",
    "dashboard.view",
    "principal.lookup",
    "compliance.view",
    "audit.export",
    "dsr.work",
    "grievance.work",
    "breach.manage",
  ],
  dpo: [
    "compliance.view",
    "supportAccess.approve",
    "dashboard.view",
    "principal.lookup",
    "dsr.work",
    "grievance.work",
    "breach.manage",
    "audit.export",
  ],
  operator: ["dashboard.view", "principal.lookup", "dsr.work", "grievance.work"],
  viewer: ["dashboard.view"],
};

export function roleHas(role: StaffRole, permission: Permission): boolean {
  return matrix[role].includes(permission);
}
