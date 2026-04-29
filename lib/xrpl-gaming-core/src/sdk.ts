import { Client, Wallet } from "xrpl";
import { ManagedNotAvailableError, XrplGamingError } from "./errors.js";
import { NftManager } from "./nft-manager.js";
import type { ManagedConfig, SdkConfig, SelfHostedConfig } from "./types.js";

function isManagedConfig(config: SdkConfig): config is ManagedConfig {
  // Treat the *presence* of `managedApiKey` (even if empty) as an attempt
  // to use managed mode, so users get a clear error instead of a confusing
  // crash inside the self-hosted code path.
  return (
    typeof config === "object" &&
    config !== null &&
    "managedApiKey" in config
  );
}

function assertSelfHosted(
  config: SelfHostedConfig,
): asserts config is SelfHostedConfig {
  if (!config.xrpl || typeof config.xrpl.nodeUrl !== "string") {
    throw new XrplGamingError(
      "Self-hosted SDK config requires `xrpl.nodeUrl` (e.g. wss://xrplcluster.com)",
    );
  }
  if (!config.xrpl.issuerWallet || !config.xrpl.issuerWallet.seed) {
    throw new XrplGamingError(
      "Self-hosted SDK config requires `xrpl.issuerWallet.seed`",
    );
  }
  if (!config.db) {
    throw new XrplGamingError(
      "Self-hosted SDK config requires a `db` adapter (e.g. PostgresAdapter, MongoAdapter)",
    );
  }
  if (!config.ipfs) {
    throw new XrplGamingError(
      "Self-hosted SDK config requires an `ipfs` adapter (e.g. PinataAdapter)",
    );
  }
}

/**
 * The main SDK entry point. Construct with either a self-hosted config
 * (XRPL node + issuer wallet + DB adapter + IPFS adapter) or a managed
 * config (`{ managedApiKey: '...' }`).
 *
 * Self-hosted example:
 * ```ts
 * const sdk = new XRPLGamingSDK({
 *   xrpl: { nodeUrl: 'wss://xrplcluster.com', issuerWallet: { seed: 'sXXX...' } },
 *   db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
 *   ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
 * });
 * await sdk.init();
 * const result = await sdk.nft.mint({ metadata: { name: 'Hero', level: 1 } });
 * ```
 */
export class XRPLGamingSDK {
  readonly nft: NftManager;
  private readonly client: Client;
  private readonly wallet: Wallet;
  private readonly config: SelfHostedConfig;
  private initialized = false;

  constructor(config: SdkConfig) {
    if (isManagedConfig(config)) {
      throw new ManagedNotAvailableError();
    }
    assertSelfHosted(config);
    this.config = config;
    this.client = new Client(config.xrpl.nodeUrl);
    this.wallet = Wallet.fromSeed(config.xrpl.issuerWallet.seed);
    this.nft = new NftManager(this.client, this.wallet, this.config, () =>
      this.assertInitialized(),
    );
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new XrplGamingError(
        "XRPLGamingSDK is not initialized — call `await sdk.init()` before performing NFT operations.",
      );
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    let xrplConnected = false;
    try {
      await this.client.connect();
      xrplConnected = true;
      await this.config.db.init();
      this.initialized = true;
    } catch (err) {
      // Best-effort cleanup so we don't leak the XRPL connection (or a
      // half-initialized DB pool) if `init()` fails partway through.
      if (xrplConnected) {
        try {
          await this.client.disconnect();
        } catch {
          /* swallow — we're already in a failure path */
        }
      }
      try {
        await this.config.db.close();
      } catch {
        /* swallow — adapter may not have anything to close */
      }
      throw err;
    }
  }

  async close(): Promise<void> {
    // `close()` is safe to call even after a failed `init()` — it tears down
    // whatever did get set up.
    try {
      if (this.client.isConnected()) {
        await this.client.disconnect();
      }
    } finally {
      await this.config.db.close();
      this.initialized = false;
    }
  }

  get issuerAddress(): string {
    return this.wallet.classicAddress;
  }

  get xrplClient(): Client {
    return this.client;
  }
}
