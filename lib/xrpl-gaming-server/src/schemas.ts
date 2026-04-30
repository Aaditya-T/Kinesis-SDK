import { z } from "zod";

export const NftMetadataSchema = z
  .record(z.string(), z.unknown())
  .describe("Free-form NFT metadata. Application-defined shape.");

export const MintRequestSchema = z.object({
  metadata: NftMetadataSchema,
  playerId: z.string().min(1).optional(),
  collection: z.string().min(1).optional(),
  destination: z
    .string()
    .min(25)
    .max(35)
    .regex(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, "Invalid XRPL address")
    .optional(),
  transferable: z.boolean().optional(),
  mutable: z.boolean().optional(),
  burnable: z.boolean().optional(),
  onlyXRP: z.boolean().optional(),
  taxon: z.number().int().nonnegative().optional(),
  transferFee: z.number().int().min(0).max(50000).optional(),
});
export type MintRequest = z.infer<typeof MintRequestSchema>;

export const UpdateRequestSchema = z.object({
  metadata: NftMetadataSchema,
  ownerSource: z.enum(["onchain", "db"]).optional(),
});
export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;

export const TransferRequestSchema = z.object({
  destination: z
    .string()
    .regex(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, "Invalid XRPL address"),
  amount: z
    .string()
    .regex(/^\d+$/, "Amount must be an integer string in drops")
    .optional(),
});
export type TransferRequest = z.infer<typeof TransferRequestSchema>;

export const TokenIdParamSchema = z.object({
  tokenId: z
    .string()
    .regex(/^[0-9A-Fa-f]{64}$/, "tokenId must be a 64-char hex string"),
});

export const NftRecordResponseSchema = z.object({
  tokenId: z.string(),
  ownerAddress: z.string(),
  issuerAddress: z.string(),
  metadataUri: z.string(),
  metadata: NftMetadataSchema,
  playerId: z.string().nullable(),
  collection: z.string().nullable(),
  pendingOfferId: z.string().nullable(),
  pendingDestination: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NftRecordResponse = z.infer<typeof NftRecordResponseSchema>;

export const MintResponseSchema = z.object({
  record: NftRecordResponseSchema,
  txHash: z.string(),
  offerId: z.string().optional(),
});

export const UpdateResponseSchema = z.object({
  record: NftRecordResponseSchema,
  txHash: z.string(),
});

export const TransferResponseSchema = z.object({
  offerId: z.string(),
  txHash: z.string(),
});

export const BurnResponseSchema = z.object({
  txHash: z.string(),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  uptimeSeconds: z.number(),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
