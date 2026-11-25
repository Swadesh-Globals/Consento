import { setupWorker, type SetupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { overviewHandlers } from "./handlers/overview";
import { programmeHandlers } from "./handlers/programme";
import { screenHandlers } from "./handlers/screens";
import { tenancyHandlers } from "./handlers/tenancy";

const handlers = [...authHandlers, ...tenancyHandlers, ...overviewHandlers, ...programmeHandlers, ...screenHandlers];

const globalForMsw = globalThis as typeof globalThis & { __mswWorker?: SetupWorker };

if (globalForMsw.__mswWorker) {
  globalForMsw.__mswWorker.resetHandlers(...handlers);
}

export const worker: SetupWorker = (globalForMsw.__mswWorker ??= setupWorker(...handlers));
