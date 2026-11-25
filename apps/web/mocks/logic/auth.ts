import type { Session, StaffRole } from "@consent/schemas";

export interface MockStaffUser {
  userId: string;
  email: string;
  displayName: string;
  roles: readonly [StaffRole, ...StaffRole[]];
}

/** Synthetic staff directory (P0 mock). Roles are bound to the account, never chosen by the client. */
export const MOCK_STAFF_PASSWORD = "demo1234";
export const mockStaffUsers: readonly MockStaffUser[] = [
  { userId: "usr_admin", email: "admin@example.in", displayName: "Oliver Bennett", roles: ["admin", "dpo"] },
  { userId: "usr_dpo", email: "dpo@example.in", displayName: "James Whitaker", roles: ["dpo"] },
  { userId: "usr_operator", email: "operator@example.in", displayName: "Harry Collins", roles: ["operator"] },
  { userId: "usr_viewer", email: "viewer@example.in", displayName: "George Turner", roles: ["viewer"] },
];

export function authenticateStaff(email: string, password: string): Session | null {
  const user = mockStaffUsers.find((u) => u.email === email.trim().toLowerCase());
  if (!user || password !== MOCK_STAFF_PASSWORD) return null;
  return {
    kind: "staff",
    userId: user.userId,
    displayName: user.displayName,
    availableRoles: [...user.roles],
    activeRole: user.roles[0],
  };
}

export type SwitchRoleResult =
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403; code: "unauthenticated" | "role_not_assigned" };

/** Deny by default: only a signed-in staff session may switch, and only to a role it already holds. */
export function applyRoleSwitch(session: Session | null, role: StaffRole): SwitchRoleResult {
  if (!session || session.kind !== "staff") return { ok: false, status: 401, code: "unauthenticated" };
  // Roles come from the account directory, not from the (client-visible) session cookie.
  const user = mockStaffUsers.find((u) => u.userId === session.userId);
  if (!user || !user.roles.includes(role)) return { ok: false, status: 403, code: "role_not_assigned" };
  return { ok: true, session: { ...session, activeRole: role } };
}
