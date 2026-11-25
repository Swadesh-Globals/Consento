"use client";

import {
  Session,
  type StaffLoginRequest,
  type StaffRole,
  type SwitchRoleRequest,
} from "@consent/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "../api-client";

const MaybeSession = z.object({ session: Session.nullable() });
const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => (await request(MaybeSession, "/auth/session")).session,
    staleTime: 60_000,
  });
}

export function useStaffLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StaffLoginRequest) => request(MaybeSession, "/auth/staff-login", { method: "POST", body }),
    onSuccess: (res) => qc.setQueryData(sessionKey, res.session),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request(MaybeSession, "/auth/sign-out", { method: "POST" }),
    onSuccess: () => qc.clear(),
  });
}

/** Switch the session's active role. The server rejects roles not assigned to the account (403). */
export function switchRole(role: StaffRole) {
  return request(MaybeSession, "/auth/switch-role", { method: "POST", body: { role } satisfies SwitchRoleRequest });
}

export function useSwitchRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: switchRole,
    onSuccess: (res) => {
      // Role changed: drop role-scoped cached data, keep the new session.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === "tenant" });
      qc.setQueryData(sessionKey, res.session);
    },
  });
}
