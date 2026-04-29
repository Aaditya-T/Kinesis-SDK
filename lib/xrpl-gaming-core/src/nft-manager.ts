import type {
  Client,
  NFTokenBurn,
  NFTokenCreateOffer,
  NFTokenMint,
  NFTokenModify,
  Wallet,
} from "xrpl";
import { XrplGamingError, XrplTransactionError } from "./errors.js";
import type {
  BurnResult,
  MintParams,
  MintResult,
  NftRecord,
  SelfHostedConfig,
  TransferParams,
  TransferResult,
  UpdateParams,
  UpdateResult,
} from "./types.js";
import {
  extractOfferIdFromMeta,
  extractTokenIdFromMeta,
  uriToHex,
} from "./util.js";

const TF_TRANSFERABLE = 0x00000008;
const TF_MUTABLE = 0x00000010;
const TF_SELL_NFTOKEN = 0x00000001;

interface SubmitMeta {
  TransactionResult?: string;
}

function checkResult(
  txType: string,
  meta: unknown,
): asserts meta is SubmitMeta {
  if (
    !meta ||
    typeof meta === "string" ||
    (meta as SubmitMeta).TransactionResult !== "tesSUCCESS"
  ) {
    const code =
      typeof meta === "object" && meta !== null
        ? (meta as SubmitMeta).TransactionResult
        : String(meta);
    throw new XrplTransactionError(txType, code ?? "unknown");
  }
}

/**
 * Game-friendly facade for XRPL DynamicNFT operations. Persists records to a
 * pluggable DB and uploads metadata to a pluggable IPFS provider.
 */
export class NftManager {
  constructor(
    private readonly client: Client,
    private readonly wallet: Wallet,
    private readonly config: SelfHostedConfig,
    private readonly assertReady: () => void = () => {},
  ) {}

  /**
   * Mint a new DynamicNFT for the issuer wallet. If `destination` is provided,
   * also creates a 0-drops sell offer to that wallet so the player can claim.
   */
  async mint(params: MintParams): Promise<MintResult> {
    this.assertReady();
    const transferable = params.transferable ?? true;
    const mutable = params.mutable ?? true;

    const upload = await this.config.ipfs.uploadJson(params.metadata, {
      name: `nft-${Date.now()}.json`,
    });

    let flags = 0;
    if (transferable) flags |= TF_TRANSFERABLE;
    if (mutable) flags |= TF_MUTABLE;

    const mintTx: NFTokenMint = {
      TransactionType: "NFTokenMint",
      Account: this.wallet.classicAddress,
      URI: uriToHex(upload.uri),
      Flags: flags,
      NFTokenTaxon: params.taxon ?? 0,
    };
    if (params.transferFee != null) {
      mintTx.TransferFee = params.transferFee;
    }

    const prepared = await this.client.autofill(mintTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta;
    checkResult("NFTokenMint", meta);

    const tokenId = extractTokenIdFromMeta(meta);
    if (!tokenId) {
      throw new XrplGamingError(
        "Could not extract NFTokenID from mint result metadata",
      );
    }

    // Persist the record IMMEDIATELY after the mint settles, before any
    // optional sell-offer creation. If the offer step fails the NFT is
    // still tracked in the DB and the caller can retry via `transfer()`,
    // rather than orphaning a minted NFT off-ledger.
    const now = new Date();
    let record: NftRecord = {
      tokenId,
      ownerAddress: this.wallet.classicAddress,
      issuerAddress: this.wallet.classicAddress,
      metadataUri: upload.uri,
      metadata: params.metadata,
      playerId: params.playerId ?? null,
      collection: params.collection ?? null,
      pendingOfferId: null,
      pendingDestination: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.config.db.saveNft(record);

    let offerId: string | undefined;
    if (params.destination) {
      const offer = await this.createSellOffer(
        tokenId,
        params.destination,
        "0",
      );
      offerId = offer.offerId;
      const patched = await this.config.db.updateNft(tokenId, {
        pendingOfferId: offer.offerId,
        pendingDestination: params.destination,
        updatedAt: new Date(),
      });
      if (patched) record = patched;
    }

    return { record, txHash: signed.hash, offerId };
  }

  /**
   * Update a DynamicNFT's metadata. Uploads new JSON to IPFS and submits an
   * NFTokenModify transaction (XLS-46 amendment) to point the on-chain URI
   * at the new content.
   */
  async update(tokenId: string, params: UpdateParams): Promise<UpdateResult> {
    this.assertReady();
    const existing = await this.config.db.getNft(tokenId);
    if (!existing) {
      throw new XrplGamingError(`NFT ${tokenId} not found in DB`);
    }

    const upload = await this.config.ipfs.uploadJson(params.metadata, {
      name: `nft-${tokenId}-${Date.now()}.json`,
    });

    const modifyTx: NFTokenModify = {
      TransactionType: "NFTokenModify",
      Account: this.wallet.classicAddress,
      NFTokenID: tokenId,
      URI: uriToHex(upload.uri),
    };

    const prepared = await this.client.autofill(modifyTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta;
    checkResult("NFTokenModify", meta);

    const now = new Date();
    const updated = await this.config.db.updateNft(tokenId, {
      metadata: params.metadata,
      metadataUri: upload.uri,
      updatedAt: now,
    });

    const record: NftRecord = updated ?? {
      ...existing,
      metadata: params.metadata,
      metadataUri: upload.uri,
      updatedAt: now,
    };

    return { record, txHash: signed.hash };
  }

  /**
   * Transfer an NFT by creating a sell offer to a specific destination wallet.
   * The destination must call NFTokenAcceptOffer to complete the transfer.
   *
   * NOTE: this does NOT change `ownerAddress` in the DB — XRPL ownership
   * only changes once the destination accepts. The DB record is annotated
   * with `pendingOfferId` and `pendingDestination`. Call
   * `markTransferComplete(tokenId, newOwner)` once the application has
   * confirmed the offer was accepted.
   */
  async transfer(
    tokenId: string,
    params: TransferParams,
  ): Promise<TransferResult> {
    this.assertReady();
    const existing = await this.config.db.getNft(tokenId);
    if (!existing) {
      throw new XrplGamingError(`NFT ${tokenId} not found in DB`);
    }

    const result = await this.createSellOffer(
      tokenId,
      params.destination,
      params.amount ?? "0",
    );

    await this.config.db.updateNft(tokenId, {
      pendingOfferId: result.offerId,
      pendingDestination: params.destination,
      updatedAt: new Date(),
    });

    return result;
  }

  /**
   * Mark a previously-issued sell offer as complete. The application is
   * responsible for confirming acceptance on-chain (via account_nfts polling
   * or ledger subscription) before calling this.
   */
  async markTransferComplete(
    tokenId: string,
    newOwnerAddress: string,
  ): Promise<NftRecord | null> {
    this.assertReady();
    return this.config.db.updateNft(tokenId, {
      ownerAddress: newOwnerAddress,
      pendingOfferId: null,
      pendingDestination: null,
      updatedAt: new Date(),
    });
  }

  /** Burn an NFT (issuer-owned only). */
  async burn(tokenId: string): Promise<BurnResult> {
    this.assertReady();
    const burnTx: NFTokenBurn = {
      TransactionType: "NFTokenBurn",
      Account: this.wallet.classicAddress,
      NFTokenID: tokenId,
    };

    const prepared = await this.client.autofill(burnTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    checkResult("NFTokenBurn", result.result.meta);

    await this.config.db.deleteNft(tokenId);
    return { txHash: signed.hash };
  }

  /** Fetch an NFT's persisted record by token ID. */
  async get(tokenId: string): Promise<NftRecord | null> {
    return this.config.db.getNft(tokenId);
  }

  /** List all NFT records associated with a player ID. */
  async listByPlayer(playerId: string): Promise<NftRecord[]> {
    return this.config.db.listNftsByPlayer(playerId);
  }

  /** List all NFT records currently associated with an XRPL owner address. */
  async listByOwner(ownerAddress: string): Promise<NftRecord[]> {
    return this.config.db.listNftsByOwner(ownerAddress);
  }

  /** List all NFT records in a named collection. */
  async listByCollection(collection: string): Promise<NftRecord[]> {
    return this.config.db.listNftsByCollection(collection);
  }

  private async createSellOffer(
    tokenId: string,
    destination: string,
    amount: string,
  ): Promise<TransferResult> {
    const offerTx: NFTokenCreateOffer = {
      TransactionType: "NFTokenCreateOffer",
      Account: this.wallet.classicAddress,
      NFTokenID: tokenId,
      Amount: amount,
      Flags: TF_SELL_NFTOKEN,
      Destination: destination,
    };

    const prepared = await this.client.autofill(offerTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    checkResult("NFTokenCreateOffer", result.result.meta);

    const offerId = extractOfferIdFromMeta(result.result.meta);
    if (!offerId) {
      throw new XrplGamingError(
        "Could not extract offer ID from sell offer result",
      );
    }
    return { offerId, txHash: signed.hash };
  }
}
