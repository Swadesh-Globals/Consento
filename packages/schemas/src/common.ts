import { z } from "zod";

export const Id = z.string().min(1).max(64);
export const IsoDateTime = z.iso.datetime({ offset: true });

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string(),
});
export type ApiError = z.infer<typeof ApiError>;

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(200),
    total: z.number().int().min(0),
  });

export const Channel = z.enum(["web", "mobile", "api", "hosted_page"]);
export type Channel = z.infer<typeof Channel>;
