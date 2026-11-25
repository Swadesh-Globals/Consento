import { NextResponse, type NextRequest } from "next/server";

const TENANT_COOKIE = "x-tenant-slug";
const DEFAULT_TENANT = "globals-inc";

/**
 * P0: ensures a tenant routing hint exists (switcher-driven, frontend.md §5).
 * P1: resolve tenant from host (<slug>.app.<domain> or verified custom domain); unknown host → 404.
 * Auth redirects run client-side in P0 mock mode; P1 moves them server-side with Better Auth.
 */
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get(TENANT_COOKIE)) {
    res.cookies.set(TENANT_COOKIE, DEFAULT_TENANT, { path: "/", sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/|mockServiceWorker.js|logos/|favicon.ico).*)"],
};