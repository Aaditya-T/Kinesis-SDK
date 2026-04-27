export type NftMetadata = Record<string, unknown>;

export interface NftRecord {
  tokenId: string;
  /**
   * The current on-chain owner of the NFT. Note that XRPL ownership only
   * changes when the destination wallet calls `NFTokenAcceptOffer` — until
   * then the issuer remains the owner, even if a sell offer has been created
   * and is `pendingOfferId` below. Applications should reconcile this field
   * by listening to ledger events or by polling `account_nfts`.
   */
  ownerAddress: string;
  issuerAddress: string;
  metadataUri: string;
  metadata: NftMetadata;
  playerId: string | null;
  collection: string | null;
  /**
   * If set, an outstanding `NFTokenCreateOffer` is waiting for the
   * destination wallet to accept. Set by `mint({ destination })` and
   * `transfer()`; cleared when the application observes the acceptance
   * (the SDK does not poll the ledger automatically).
   */
  pendingOfferId: string | null;
  /**
   * The intended recipient when a `pendingOfferId` is outstanding. Cleared
   * once the offer is accepted/cancelled and the application calls
   * `nft.markTransferComplete(tokenId, newOwner)`.
   */
  pendingDestination: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MintParams {
  metadata: NftMetadata;
  playerId?: string;
  collection?: string;
  destination?: string;
  transferable?: boolean;
  mutable?: boolean;
  taxon?: number;
  transferFee?: number;
}

export interface MintResult {
  record: NftRecord;
  txHash: string;
  offerId?: string;
}

export interface UpdateParams {
  metadata: NftMetadata;
}

export interface UpdateResult {
  record: NftRecord;
  txHash: string;
}

export interface TransferParams {
  destination: string;
  amount?: string;
}

export interface TransferResult {
  offerId: string;
  txHash: string;
}

export interface BurnResult {
  txHash: string;
}

export interface XrplConfig {
  nodeUrl: string;
  issuerWallet: { seed: string };
  networkId?: number;
}

export interface SelfHostedConfig {
  xrpl: XrplConfig;
  db: import("./adapters").IDBAdapter;
  ipfs: import("./adapters").IIPFSAdapter;
}

export interface ManagedConfig {
  managedApiKey: string;
  endpoint?: string;
}

export type SdkConfig = SelfHostedConfig | ManagedConfig;
