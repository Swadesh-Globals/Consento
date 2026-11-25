import { StaffLoginRequest, SwitchRoleRequest } from "@consent/schemas";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../base";
import { apiError, latency } from "../scenarios";
import { applyRoleSwitch, authenticateStaff } from "../logic/auth";
import { readMockSession, writeMockSession } from "../session";

export const authHandlers = [
  http.get(`${API_BASE_URL}/auth/session`, async () => {
    await latency();
    return HttpResponse.json({ session: readMockSession() });
  }),

  http.post(`${API_BASE_URL}/auth/staff-login`, async ({ request }) => {
    await latency();
    const body = StaffLoginRequest.safeParse(await request.json());
    if (!body.success) return apiError(400, "validation_error", "Enter your email and password");
    const session = authenticateStaff(body.data.email, body.data.password);
    // Same error for unknown user and wrong password — no account enumeration.
    if (!session) return apiError(401, "invalid_credentials", "Email or password is not correct.");
    writeMockSession(session);
    return HttpResponse.json({ session });
  }),

  http.post(`${API_BASE_URL}/auth/switch-role`, async ({ request }) => {
    await latency();
    const body = SwitchRoleRequest.safeParse(await request.json());
    if (!body.success) return apiError(400, "validation_error", "Unknown role");
    const result = applyRoleSwitch(readMockSession(), body.data.role);
    if (!result.ok) {
      return apiError(result.status, result.code, result.status === 401 ? "Sign in again" : "That role is not assigned to you");
    }
    writeMockSession(result.session);
    return HttpResponse.json({ session: result.session });
  }),

  http.post(`${API_BASE_URL}/auth/sign-out`, async () => {
    await latency();
    writeMockSession(null);
    return HttpResponse.json({ session: null });
  }),
];
