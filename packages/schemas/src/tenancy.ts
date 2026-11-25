import { z } from "zod";
import { Id } from "./common";

export const TenantSlug = z.string().regex(/^[a-z0-9-]{3,40}$/);

export const TenantSummary = z.object({
  id: Id,
  slug: TenantSlug,
  name: z.string().min(1).max(120),
  dpoEmail: z.email(),
  /** Client logo shown in the console header (CFG-12 branding); null shows the placeholder. */
  logoUrl: z.string().nullable(),
});
export type TenantSummary = z.infer<typeof TenantSummary>;

export const TenantList = z.object({ items: z.array(TenantSummary) });
