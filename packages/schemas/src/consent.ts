import { z } from "zod";
import { Channel, Id, IsoDateTime } from "./common";
import { Purpose } from "./catalogue";

/** ENG-02 state machine */
export const ConsentStatus = z.enum(["requested", "granted", "denied", "withdrawn", "expired"]);
export type ConsentStatus = z.infer<typeof ConsentStatus>;

export const ConsentArtefact = z.object({
  id: Id,
  principalId: Id,
  purpose: Purpose,
  status: ConsentStatus,
  noticeVersion: z.string(),
  noticeHash: z.string().regex(/^[a-f0-9]{64}$/),
  channel: Channel,
  grantedAt: IsoDateTime.nullable(),
  validUntil: IsoDateTime.nullable(),
  updatedAt: IsoDateTime,
});
export type ConsentArtefact = z.infer<typeof ConsentArtefact>;

export const ConsentList = z.object({ items: z.array(ConsentArtefact) });

export const ConsentEventType = z.enum(["requested", "granted", "denied", "withdrawn", "expired", "renewed"]);

/** ENG-04 ledger entry as exposed to the UI */
export const LedgerEntry = z.object({
  seq: z.number().int().min(1),
  consentId: Id,
  purposeName: z.string(),
  event: ConsentEventType,
  at: IsoDateTime,
  channel: Channel,
  entryHash: z.string().regex(/^[a-f0-9]{64}$/),
  prevHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export type LedgerEntry = z.infer<typeof LedgerEntry>;

export const ConsentHistory = z.object({ items: z.array(LedgerEntry) });

export const Receipt = z.object({
  consentId: Id,
  /** Compact JWS of the signed artefact (ENG-03); mock-signed in P0 */
  jws: z.string(),
  issuedAt: IsoDateTime,
});
export type Receipt = z.infer<typeof Receipt>;
