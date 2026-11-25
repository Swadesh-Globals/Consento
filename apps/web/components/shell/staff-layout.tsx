"use client";

import type { ReactNode } from "react";
import { ConsoleShell } from "./console-shell";
import { RequireSession } from "./require-session";

export function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession kind="staff" redirectTo="/login">
      {(s) => <ConsoleShell session={s}>{children}</ConsoleShell>}
    </RequireSession>
  );
}
