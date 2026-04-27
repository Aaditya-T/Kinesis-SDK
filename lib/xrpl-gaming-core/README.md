# @workspace/xrpl-gaming-core

The core of the XRPL Gaming SDK. Provides the `XRPLGamingSDK` class and the pluggable adapter interfaces (`IDBAdapter`, `IIPFSAdapter`) that power it.

## Install

```bash
pnpm add @workspace/xrpl-gaming-core @workspace/xrpl-gaming-ipfs-pinata @workspace/xrpl-gaming-db-postgres
```

## Self-hosted usage

You bring your own XRPL wallet seed, XRPL node URL, database, and Pinata account. The SDK glues them together.

```ts
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";
import { PostgresAdapter } from "@workspace/xrpl-gaming-db-postgres";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://xrplcluster.com",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});

await sdk.init();

// Mint a DynamicNFT for a player
const { record, txHash, offerId } = await sdk.nft.mint({
  metadata: { name: "Wandering Knight", class: "warrior", level: 1, power: 50 },
  playerId: "player-123",
  collection: "characters",
  destination: "rPlayerWalletAddress...", // optional sell offer
});

// Later, level up — updates the on-chain URI via NFTokenModify
await sdk.nft.update(record.tokenId, {
  metadata: { name: "Wandering Knight", class: "warrior", level: 2, power: 95 },
});

// Read current state from your DB
const current = await sdk.nft.get(record.tokenId);

// Transfer to another wallet (creates a sell offer — destination must accept)
const { offerId } = await sdk.nft.transfer(record.tokenId, {
  destination: "rNewOwner...",
});
// `record.ownerAddress` does NOT change yet — XRPL ownership only flips
// when the destination calls NFTokenAcceptOffer. The DB row gets
// `pendingOfferId` and `pendingDestination` annotations so you can show
// "transfer pending" in your UI.
//
// Once you've confirmed the offer was accepted (e.g. by polling
// `account_nfts` or subscribing to ledger events), reconcile the DB:
await sdk.nft.markTransferComplete(record.tokenId, "rNewOwner...");

// Burn (issuer-owned only)
await sdk.nft.burn(record.tokenId);

await sdk.close();
```

## Managed usage (preview)

The managed tier is not yet available. Constructing the SDK with `managedApiKey` throws a `ManagedNotAvailableError` with instructions to use the self-hosted path or get in touch.

```ts
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";

// Will throw ManagedNotAvailableError until the hosted backend is online.
const sdk = new XRPLGamingSDK({ managedApiKey: "xg_live_xxx" });
```

## DynamicNFT details

- NFTs are minted with the `tfMutable` flag (XLS-46) so the issuer can update their URI.
- `update()` issues an `NFTokenModify` transaction that replaces the URI with a new IPFS pointer.
- Transfers use `NFTokenCreateOffer` (sell offer at 0 drops by default) targeted to the destination wallet, which must accept the offer to complete the transfer.

## Build your own adapter

Implement `IDBAdapter` or `IIPFSAdapter` for any backend you like. See `@workspace/xrpl-gaming-db-mongodb` and `@workspace/xrpl-gaming-ipfs-pinata` for reference implementations.
