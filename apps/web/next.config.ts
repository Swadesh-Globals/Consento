import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const apiMode = process.env.NEXT_PUBLIC_API_MODE ?? "mock";

if (!isDev && apiMode === "mock" && process.env.ALLOW_MOCK_BUILD !== "1") {
  // frontend.md §7.3: production builds fail in mock mode. P0 staging export sets ALLOW_MOCK_BUILD=1 explicitly.
  throw new Error("NEXT_PUBLIC_API_MODE=mock is not allowed in production builds.");
}

// P0 CSP: no unsafe-eval in production. Dev needs unsafe-eval for React refresh; nonce-based CSP lands with P1 hardening.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@consent/ui", "@consent/schemas", "@consent/i18n"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
