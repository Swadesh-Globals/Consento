"use client";

import { useEffect } from "react";
import { worker } from "@/mocks/browser";

let startPromise: Promise<unknown> | null = null;

function ensureWorkerStarted(): Promise<unknown> {
  if (Number(worker.readyState) !== 0) return Promise.resolve();
  startPromise ??= worker.start({ onUnhandledFrame: "bypass", quiet: true }).finally(() => {
    startPromise = null;
  });
  return startPromise;
}

/** Browser-only: loaded with next/dynamic(ssr:false) so msw/browser never enters the server bundle. */
export default function MockBootstrap({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let active = true;
    void ensureWorkerStarted().then(() => {
      if (active) onReady();
    });
    return () => {
      active = false;
    };
  }, [onReady]);
  return null;
}
