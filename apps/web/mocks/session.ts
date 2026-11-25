import { Session } from "@consent/schemas";

/**
 * Mock-mode session only (frontend.md §6.1): a non-HttpOnly dev cookie so reloads keep you signed in.
 * Holds role / principal id only — no contact data. Removed in P1 in favour of Better Auth HttpOnly cookies.
 */
const COOKIE = "mock-session";

export function readMockSession(): Session | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed = Session.safeParse(JSON.parse(atob(decodeURIComponent(raw))));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeMockSession(session: Session | null): void {
  if (!session) {
    document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${COOKIE}=${encodeURIComponent(btoa(JSON.stringify(session)))}; Path=/; SameSite=Lax`;
}

export function tenantFrom(request: Request): string {
  return request.headers.get("x-tenant-slug") ?? "globals-inc";
}
