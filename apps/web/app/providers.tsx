"use client";

import { createI18n } from "@consent/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { API_MODE } from "@/lib/config";
import { ApiRequestError } from "@/lib/api-client";
import { TenantProvider } from "@/lib/tenant/tenant-context";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, err) => !(err instanceof ApiRequestError && err.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** MSW is the sanctioned exception to "app never imports mocks": browser-only, mock mode only (frontend.md §7.3). */
const MockBootstrap = dynamic(() => import("./mock-bootstrap"), { ssr: false });

export function Providers({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: ReactNode;
}) {
  const [queryClient] = useState(makeQueryClient);
  const [i18n] = useState(() => createI18n());
  const [ready, setReady] = useState(API_MODE !== "mock");
  const onReady = useCallback(() => setReady(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {API_MODE === "mock" ? <MockBootstrap onReady={onReady} /> : null}
      <I18nextProvider i18n={i18n}>
        <TenantProvider initialSlug={tenantSlug}>
          {ready ? children : <div role="status" aria-label="Loading" className="min-h-screen" />}
        </TenantProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
