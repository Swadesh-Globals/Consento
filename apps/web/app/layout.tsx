import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { TENANT_COOKIE } from "@/lib/config";
import { DEFAULT_TENANT } from "@/lib/tenant/tenant-context";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Globals Consent",
  description: "DPDP Act 2023 consent management",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const tenantSlug = jar.get(TENANT_COOKIE)?.value ?? DEFAULT_TENANT;

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-text antialiased">
        <Providers tenantSlug={tenantSlug}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
