import { ApiError } from "@consent/schemas";
import type { z } from "zod";
import { API_BASE_URL, TENANT_COOKIE } from "./config";
import { readCookie } from "./cookies";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body.code;
    this.requestId = body.requestId;
    this.fieldErrors = body.fieldErrors;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * The only network entry point in the app (frontend.md §7.1).
 * Tenant slug is a routing hint only — the backend derives tenant from the session.
 * Every response is parsed with its Zod schema.
 */
export async function request<S extends z.ZodType>(
  schema: S,
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<z.infer<S>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const tenant = readCookie(TENANT_COOKIE);
  if (tenant) headers["x-tenant-slug"] = tenant;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["Idempotency-Key"] = crypto.randomUUID();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? null : JSON.stringify(body),
    signal: signal ?? null,
  });

  const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = ApiError.safeParse(json);
    throw new ApiRequestError(
      res.status,
      parsed.success
        ? parsed.data
        : { code: "unknown_error", message: "Unexpected error", requestId: res.headers.get("x-request-id") ?? "n/a" },
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // Schema mismatch is a contract bug. Report without payload (no PII).
    throw new ApiRequestError(500, {
      code: "contract_mismatch",
      message: `Response for ${method} ${path.split("?")[0]} did not match its schema`,
      requestId: res.headers.get("x-request-id") ?? "n/a",
    });
  }
  return parsed.data;
}
