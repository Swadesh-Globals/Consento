"use client";

import { Button } from "@consent/ui";

// No error details rendered: no stack traces or internals to users (PRD §9.1 A05).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-8">
      <h1 className="text-h2">Something went wrong</h1>
      <p className="text-body text-text-muted">An unexpected error occurred. Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
