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
  /**
   * `tfTransferable` (0x00000008). When `true` (default) the NFT can be
   * transferred between non-issuer wallets. When `false` it can only ever
   * move back to the issuer.
   */
  transferable?: boolean;
  /**
   * `tfMutable` (0x00000010, XLS-46). When `true` (default) the issuer can
   * later call `nft.update()` / `NFTokenModify` to change the metadata URI.
   * When `false` the metadata is frozen at mint and `update()` will fail.
   */
  mutable?: boolean;
  /**
   * `tfBurnable` (0x00000001). When `true` the *issuer* can burn the NFT
   * even after a player owns it. Default `false` — only the current holder
   * can burn.
   */
  burnable?: boolean;
  /**
   * `tfOnlyXRP` (0x00000002). When `true` any sell/buy offers for this NFT
   * must be denominated in XRP (no IOUs). Default `false`.
   */
  onlyXRP?: boolean;
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
  /**
   * How `update()` should resolve the current on-chain owner so it can
   * attach the XLS-46 `Owner` field to `NFTokenModify` when the issuer is
   * acting on a token they no longer hold.
   *
   * - `"onchain"` (default) — query the XRPL via the Clio-only `nft_info`
   *   RPC. Always accurate, but **requires the SDK's `nodeUrl` to point at
   *   a Clio server** (most public XRPL clusters expose Clio; self-hosted
   *   rippled-only setups do not).
   * - `"db"` — read `ownerAddress` from the SDK's DB record. Cheaper (no
   *   network round-trip) and works against any XRPL node, but only
   *   correct if your application has been calling
   *   `sdk.nft.markTransferComplete(tokenId, newOwner)` after every
   *   accepted sell offer. If you skip that reconciliation the modify
   *   will fail with `tecNO_ENTRY`.
   */
  ownerSource?: "onchain" | "db";
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
