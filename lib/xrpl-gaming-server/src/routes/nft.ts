import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import type { XRPLGamingSDK, NftRecord } from "@workspace/xrpl-gaming-core";
import {
  BurnResponseSchema,
  MintRequestSchema,
  MintResponseSchema,
  NftRecordResponseSchema,
  TokenIdParamSchema,
  TransferRequestSchema,
  TransferResponseSchema,
  UpdateRequestSchema,
  UpdateResponseSchema,
  type NftRecordResponse,
} from "../schemas";

/** Convert an SDK record to its JSON-safe response shape (Date → ISO string). */
function recordToJson(record: NftRecord): NftRecordResponse {
  return {
    tokenId: record.tokenId,
    ownerAddress: record.ownerAddress,
    issuerAddress: record.issuerAddress,
    metadataUri: record.metadataUri,
    metadata: record.metadata,
    playerId: record.playerId,
    collection: record.collection,
    pendingOfferId: record.pendingOfferId,
    pendingDestination: record.pendingDestination,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Wrap an async handler so thrown errors are forwarded to express's error
 * pipeline (errorHandler). express 5 supports async handlers natively but
 * keeping this wrapper is cheap and works on both 4 and 5.
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function nftRouter(sdk: XRPLGamingSDK): IRouter {
  const router = Router();

  // POST /nft/mint
  router.post(
    "/nft/mint",
    asyncHandler(async (req, res) => {
      const body = MintRequestSchema.parse(req.body);
      const result = await sdk.nft.mint(body);
      const payload = MintResponseSchema.parse({
        record: recordToJson(result.record),
        txHash: result.txHash,
        offerId: result.offerId,
      });
      res.status(201).json(payload);
    }),
  );

  // PATCH /nft/:tokenId
  router.patch(
    "/nft/:tokenId",
    asyncHandler(async (req, res) => {
      const { tokenId } = TokenIdParamSchema.parse(req.params);
      const body = UpdateRequestSchema.parse(req.body);
      const result = await sdk.nft.update(tokenId, body);
      const payload = UpdateResponseSchema.parse({
        record: recordToJson(result.record),
        txHash: result.txHash,
      });
      res.json(payload);
    }),
  );

  // POST /nft/:tokenId/transfer
  router.post(
    "/nft/:tokenId/transfer",
    asyncHandler(async (req, res) => {
      const { tokenId } = TokenIdParamSchema.parse(req.params);
      const body = TransferRequestSchema.parse(req.body);
      const result = await sdk.nft.transfer(tokenId, body);
      const payload = TransferResponseSchema.parse({
        offerId: result.offerId,
        txHash: result.txHash,
      });
      res.json(payload);
    }),
  );

  // DELETE /nft/:tokenId
  router.delete(
    "/nft/:tokenId",
    asyncHandler(async (req, res) => {
      const { tokenId } = TokenIdParamSchema.parse(req.params);
      const result = await sdk.nft.burn(tokenId);
      const payload = BurnResponseSchema.parse({ txHash: result.txHash });
      res.json(payload);
    }),
  );

  // GET /nft/:tokenId
  router.get(
    "/nft/:tokenId",
    asyncHandler(async (req, res) => {
      const { tokenId } = TokenIdParamSchema.parse(req.params);
      const record = await sdk.nft.get(tokenId);
      if (!record) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `NFT ${tokenId} not found`,
          },
        });
        return;
      }
      const payload = NftRecordResponseSchema.parse(recordToJson(record));
      res.json(payload);
    }),
  );

  return router;
}
