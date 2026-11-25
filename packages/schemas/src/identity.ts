import { z } from "zod";
import { Id } from "./common";

export const StaffRole = z.enum(["admin", "dpo", "operator", "viewer"]);
export type StaffRole = z.infer<typeof StaffRole>;

export const SessionKind = z.enum(["staff"]);

export const Session = z.object({
  kind: z.literal("staff"),
  userId: Id,
  displayName: z.string(),
  /** Roles granted to this account; the user may switch between them. */
  availableRoles: z.array(StaffRole).min(1),
  /** Role the session currently acts as; always one of availableRoles. */
  activeRole: StaffRole,
});
export type Session = z.infer<typeof Session>;

export const StaffLoginRequest = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(1, "Enter your password").max(256),
});
export type StaffLoginRequest = z.infer<typeof StaffLoginRequest>;

export const SwitchRoleRequest = z.object({ role: StaffRole });
export type SwitchRoleRequest = z.infer<typeof SwitchRoleRequest>;
