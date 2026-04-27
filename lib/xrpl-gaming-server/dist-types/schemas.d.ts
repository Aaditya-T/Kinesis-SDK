import { z } from "zod";
export declare const NftMetadataSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const MintRequestSchema: z.ZodObject<{
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    playerId: z.ZodOptional<z.ZodString>;
    collection: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    transferable: z.ZodOptional<z.ZodBoolean>;
    mutable: z.ZodOptional<z.ZodBoolean>;
    taxon: z.ZodOptional<z.ZodNumber>;
    transferFee: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    metadata: Record<string, unknown>;
    playerId?: string | undefined;
    collection?: string | undefined;
    destination?: string | undefined;
    transferable?: boolean | undefined;
    mutable?: boolean | undefined;
    taxon?: number | undefined;
    transferFee?: number | undefined;
}, {
    metadata: Record<string, unknown>;
    playerId?: string | undefined;
    collection?: string | undefined;
    destination?: string | undefined;
    transferable?: boolean | undefined;
    mutable?: boolean | undefined;
    taxon?: number | undefined;
    transferFee?: number | undefined;
}>;
export type MintRequest = z.infer<typeof MintRequestSchema>;
export declare const UpdateRequestSchema: z.ZodObject<{
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    metadata: Record<string, unknown>;
}, {
    metadata: Record<string, unknown>;
}>;
export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;
export declare const TransferRequestSchema: z.ZodObject<{
    destination: z.ZodString;
    amount: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    destination: string;
    amount?: string | undefined;
}, {
    destination: string;
    amount?: string | undefined;
}>;
export type TransferRequest = z.infer<typeof TransferRequestSchema>;
export declare const TokenIdParamSchema: z.ZodObject<{
    tokenId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tokenId: string;
}, {
    tokenId: string;
}>;
export declare const NftRecordResponseSchema: z.ZodObject<{
    tokenId: z.ZodString;
    ownerAddress: z.ZodString;
    issuerAddress: z.ZodString;
    metadataUri: z.ZodString;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    playerId: z.ZodNullable<z.ZodString>;
    collection: z.ZodNullable<z.ZodString>;
    pendingOfferId: z.ZodNullable<z.ZodString>;
    pendingDestination: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tokenId: string;
    ownerAddress: string;
    issuerAddress: string;
    metadataUri: string;
    metadata: Record<string, unknown>;
    playerId: string | null;
    collection: string | null;
    pendingOfferId: string | null;
    pendingDestination: string | null;
    createdAt: string;
    updatedAt: string;
}, {
    tokenId: string;
    ownerAddress: string;
    issuerAddress: string;
    metadataUri: string;
    metadata: Record<string, unknown>;
    playerId: string | null;
    collection: string | null;
    pendingOfferId: string | null;
    pendingDestination: string | null;
    createdAt: string;
    updatedAt: string;
}>;
export type NftRecordResponse = z.infer<typeof NftRecordResponseSchema>;
export declare const MintResponseSchema: z.ZodObject<{
    record: z.ZodObject<{
        tokenId: z.ZodString;
        ownerAddress: z.ZodString;
        issuerAddress: z.ZodString;
        metadataUri: z.ZodString;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        playerId: z.ZodNullable<z.ZodString>;
        collection: z.ZodNullable<z.ZodString>;
        pendingOfferId: z.ZodNullable<z.ZodString>;
        pendingDestination: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    }, {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    txHash: z.ZodString;
    offerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    record: {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    };
    txHash: string;
    offerId?: string | undefined;
}, {
    record: {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    };
    txHash: string;
    offerId?: string | undefined;
}>;
export declare const UpdateResponseSchema: z.ZodObject<{
    record: z.ZodObject<{
        tokenId: z.ZodString;
        ownerAddress: z.ZodString;
        issuerAddress: z.ZodString;
        metadataUri: z.ZodString;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        playerId: z.ZodNullable<z.ZodString>;
        collection: z.ZodNullable<z.ZodString>;
        pendingOfferId: z.ZodNullable<z.ZodString>;
        pendingDestination: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    }, {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    record: {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    };
    txHash: string;
}, {
    record: {
        tokenId: string;
        ownerAddress: string;
        issuerAddress: string;
        metadataUri: string;
        metadata: Record<string, unknown>;
        playerId: string | null;
        collection: string | null;
        pendingOfferId: string | null;
        pendingDestination: string | null;
        createdAt: string;
        updatedAt: string;
    };
    txHash: string;
}>;
export declare const TransferResponseSchema: z.ZodObject<{
    offerId: z.ZodString;
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    txHash: string;
    offerId: string;
}, {
    txHash: string;
    offerId: string;
}>;
export declare const BurnResponseSchema: z.ZodObject<{
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    txHash: string;
}, {
    txHash: string;
}>;
export declare const HealthResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
    uptimeSeconds: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "ok";
    uptimeSeconds: number;
}, {
    status: "ok";
    uptimeSeconds: number;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: unknown;
    }, {
        message: string;
        code: string;
        details?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code: string;
        details?: unknown;
    };
}, {
    error: {
        message: string;
        code: string;
        details?: unknown;
    };
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map