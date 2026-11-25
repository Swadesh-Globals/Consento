import { TenantList } from "@consent/schemas";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../base";
import { tenants } from "../seed";
import { latency } from "../scenarios";

export const tenancyHandlers = [
  http.get(`${API_BASE_URL}/tenants`, async () => {
    await latency();
    return HttpResponse.json(TenantList.parse({ items: tenants }));
  }),
];
