/**
 * Types shared between the XRPL testnet demo hook and the UI components
 * that render its state. Kept in their own module so the design surface
 * can import them without dragging in the `xrpl` package.
 */

export interface NftMetadata {
  name: string;
  characterClass: string;
  level: number;
  power: number;
}

export interface MintedNft {
  /** 64-char hex NFTokenID returned by the validated NFTokenMint tx. */
  tokenId: string;
  /** The metadata currently encoded into the on-chain URI. */
  metadata: NftMetadata;
  /** The data URL currently stored in the NFT's `URI` field. */
  uri: string;
  /** The previous on-chain URI (set after the first NFTokenModify). */
  previousUri?: string;
  /** Hash of the NFTokenMint transaction. */
  mintTxHash: string;
  /** Hash of the most recent NFTokenModify transaction (set after a level-up). */
  lastUpdateTxHash?: string;
  /** Number of times this NFT has been mutated on-chain. */
  updateCount: number;
}

export type DemoStatus =
  | "idle"
  | "funding"
  | "ready-to-mint"
  | "minting"
  | "ready"
  | "updating"
  | "error";

export interface DemoState {
  status: DemoStatus;
  /** Last error message, if any — cleared whenever a new action starts. */
  error?: string;
  /** XRPL classic address of the funded testnet wallet. */
  walletAddress?: string;
  /** Wallet balance in XRP, formatted to 2 decimals. */
  walletBalanceXrp?: string;
  /** Currently-minted NFT (if the user has minted one). */
  nft?: MintedNft;
  /** Append-only audit log shown to the user as the demo progresses. */
  log: DemoLogEntry[];
}

export interface DemoLogEntry {
  id: string;
  timestamp: number;
  kind: "info" | "tx" | "error";
  message: string;
  /** Optional XRPL transaction hash — the UI links it to the explorer. */
  txHash?: string;
}

export interface UseXrplDemo {
  state: DemoState;
  /** Fund a fresh testnet wallet via the XRPL faucet. */
  fundWallet: () => Promise<void>;
  /** Mint a fresh DynamicNFT with the supplied character metadata. */
  mintNft: (metadata: NftMetadata) => Promise<void>;
  /** Bump the NFT's level + power and write the new metadata on-chain via NFTokenModify. */
  levelUp: () => Promise<void>;
  /** Reset to the initial idle state and disconnect the XRPL client. */
  reset: () => Promise<void>;
  /** Base URL of the XRPL testnet explorer (e.g. https://testnet.xrpl.org). */
  explorerBaseUrl: string;
  /** Build a deep link to a transaction on the testnet explorer. */
  txExplorerUrl: (txHash: string) => string;
  /** Build a deep link to an NFT on the testnet explorer. */
  nftExplorerUrl: (tokenId: string) => string;
  /** Build a deep link to an account on the testnet explorer. */
  accountExplorerUrl: (address: string) => string;
}
