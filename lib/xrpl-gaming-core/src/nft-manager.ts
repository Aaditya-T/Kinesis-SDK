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
  toRippleTime,
  uriToHex,
} from "./util.js";

// NFTokenMint flags (XLS-20 + XLS-46)
const TF_BURNABLE = 0x00000001;
const TF_ONLY_XRP = 0x00000002;
const TF_TRANSFERABLE = 0x00000008;
const TF_MUTABLE = 0x00000010;
// NFTokenCreateOffer flags
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
   * the SDK packs an XLS-46 inline sell offer onto the same `NFTokenMint`
   * transaction (using the `Amount` / `Destination` / `Expiration` fields)
   * so the mint and the offer settle in a single ledger close — no
   * follow-up `NFTokenCreateOffer` and no risk of an NFT existing on-ledger
   * without the corresponding offer.
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
    if (params.burnable) flags |= TF_BURNABLE;
    if (params.onlyXRP) flags |= TF_ONLY_XRP;

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

    // XLS-46: when `destination` is set, attach the inline sell-offer
    // fields so we don't need a follow-up NFTokenCreateOffer transaction.
    // The XRPL requires `Amount` whenever `Destination` is present —
    // default to "0" drops so the recipient can claim for free.
    // `Amount` and `Expiration` only describe the inline sell offer, so
    // they're only meaningful when a destination is given. Reject the
    // mismatched combinations early to avoid silently building a tx
    // shape the caller didn't intend.
    if (params.destination) {
      mintTx.Destination = params.destination;
      mintTx.Amount = params.amount ?? "0";
      if (params.expiration != null) {
        mintTx.Expiration = toRippleTime(params.expiration);
      }
    } else {
      if (params.amount != null) {
        throw new XrplGamingError(
          "MintParams.amount only applies when MintParams.destination is set " +
            "(it's the price of the XLS-46 inline sell offer).",
        );
      }
      if (params.expiration != null) {
        throw new XrplGamingError(
          "MintParams.expiration only applies when MintParams.destination is " +
            "set (it expires the XLS-46 inline sell offer).",
        );
      }
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

    // The same metadata also carries the new NFTokenOffer that the
    // inline-offer fields create. Pull it out so callers get back both
    // ids in one call.
    let offerId: string | undefined;
    if (params.destination) {
      const id = extractOfferIdFromMeta(meta);
      if (!id) {
        throw new XrplGamingError(
          `NFTokenMint for ${tokenId} succeeded but the inline sell ` +
            `offer to ${params.destination} could not be located in the ` +
            `transaction metadata. Inspect tx ${signed.hash} on a ledger ` +
            `explorer to recover it manually.`,
        );
      }
      offerId = id;
    }

    // Mint + offer were atomic, so persist the DB row once with the
    // final state. No more save-then-patch dance.
    const now = new Date();
    const record: NftRecord = {
      tokenId,
      ownerAddress: this.wallet.classicAddress,
      issuerAddress: this.wallet.classicAddress,
      metadataUri: upload.uri,
      metadata: params.metadata,
      playerId: params.playerId ?? null,
      collection: params.collection ?? null,
      pendingOfferId: offerId ?? null,
      pendingDestination: params.destination ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.config.db.saveNft(record);

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

    // XLS-46: when the issuer modifies an NFT they no longer own (e.g. the
    // player has accepted the sell offer and now holds the token), the tx
    // MUST carry the `Owner` field pointing at the current holder.
    // Submitting without it returns `tecNO_ENTRY` / `tecNO_PERMISSION`.
    //
    // Two ways to discover that owner:
    //   - "onchain" (default) — ask the XRPL via Clio's `nft_info` RPC.
    //     Always accurate but requires `nodeUrl` to point at a Clio
    //     server (which most public clusters are).
    //   - "db" — read it from the DB record. Cheaper but only correct
    //     if the application has been calling `markTransferComplete`
    //     after every accepted offer.
    const ownerSource = params.ownerSource ?? "onchain";
    const currentOwner =
      ownerSource === "onchain"
        ? await this.fetchOwnerOnchain(tokenId)
        : existing.ownerAddress;
    if (currentOwner !== this.wallet.classicAddress) {
      modifyTx.Owner = currentOwner;
    }

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

  /**
   * Resolve the current on-chain owner of an NFT using Clio's `nft_info`
   * RPC. Throws a clear `XrplGamingError` if the configured `nodeUrl`
   * isn't a Clio server (rippled-only nodes don't implement this method).
   * See https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/clio-methods/nft_info
   */
  private async fetchOwnerOnchain(tokenId: string): Promise<string> {
    let response: { result: { owner?: string } };
    try {
      // `nft_info` is a Clio-only command and isn't in xrpl.js's typed
      // request union, so we cast through `unknown` to keep types honest
      // while still handing the underlying client a plain object.
      response = (await this.client.request({
        command: "nft_info",
        nft_id: tokenId,
      } as unknown as Parameters<Client["request"]>[0])) as unknown as {
        result: { owner?: string };
      };
    } catch (err) {
      const detail =
        (err as { data?: { error_message?: string } })?.data?.error_message ??
        (err as Error)?.message ??
        String(err);
      throw new XrplGamingError(
        `Failed to resolve NFT owner via nft_info for ${tokenId}: ${detail}. ` +
          `nft_info is a Clio-only XRPL RPC method — point your SDK ` +
          `nodeUrl at a Clio server (most public XRPL clusters expose ` +
          `Clio), or pass { ownerSource: "db" } to fall back to the ` +
          `DB-tracked owner.`,
      );
    }
    const owner = response?.result?.owner;
    if (typeof owner !== "string" || owner.length === 0) {
      throw new XrplGamingError(
        `nft_info did not return an owner for ${tokenId}. ` +
          `Either the NFT does not exist on this network or the node ` +
          `responded with an unexpected shape.`,
      );
    }
    return owner;
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
