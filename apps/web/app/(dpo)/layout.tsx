import type { ReactNode } from "react";
import { StaffLayout } from "@/components/shell/staff-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <StaffLayout>{children}</StaffLayout>;
}