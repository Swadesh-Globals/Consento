import { z } from "zod";
import { Id } from "./common";

export const LawfulBasis = z.enum(["consent", "legitimate_use"]);

export const DataElement = z.object({
  id: Id,
  name: z.string().min(1).max(80),
  category: z.enum(["identity", "contact", "financial", "behavioural", "device", "health", "other"]),
});
export type DataElement = z.infer<typeof DataElement>;

export const Purpose = z.object({
  id: Id,
  name: z.string().min(1).max(120),
  description: z.string().max(1000),
  lawfulBasis: LawfulBasis,
  dataElements: z.array(DataElement),
  retentionDays: z.number().int().min(1).max(3650),
  mandatory: z.boolean(),
});
export type Purpose = z.infer<typeof Purpose>;
