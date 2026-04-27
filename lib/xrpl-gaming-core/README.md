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

## Operation ordering & consistency model

`mint()` and `update()` perform their XRPL transaction first and then write/patch the DB record:

1. `ipfs.uploadJson(metadata)` — pin metadata
2. `client.submitAndWait(NFTokenMint | NFTokenModify)` — settle on-chain
3. `db.saveNft(...)` / `db.updateNft(...)` — persist the authoritative on-chain result (token id, URI, timestamps)

This guarantees we never advertise a DB row that points at a non-existent or out-of-date ledger object. The trade-off is that if the DB write fails *after* a successful XRPL settlement, you can rebuild the row by reading `account_nfts` for the issuer wallet and replaying it through `db.saveNft`. For `mint({ destination })`, the DB row is written immediately after the mint succeeds and *before* the optional sell-offer creation, so a failed offer never orphans a minted NFT.

## Transfer is offer-based — you must reconcile

`sdk.nft.transfer()` does **not** flip ownership immediately. It issues an `NFTokenCreateOffer` (sell offer) targeted at the destination wallet and returns the `offerId`. Until the destination wallet calls `NFTokenAcceptOffer` on the XRPL, the issuer still owns the token. The DB row reflects this with two columns:

- `pendingOfferId` — the open sell offer id
- `pendingDestination` — the intended recipient

Your application is responsible for detecting acceptance (poll `account_nfts` for the destination, or subscribe to ledger events) and then calling `sdk.nft.markTransferComplete(tokenId, newOwnerAddress)` to clear the pending fields and update `ownerAddress`. Future managed-tier and server packages will provide a watcher that automates this.

## Build your own adapter

Implement `IDBAdapter` or `IIPFSAdapter` for any backend you like. See `@workspace/xrpl-gaming-db-mongodb` and `@workspace/xrpl-gaming-ipfs-pinata` for reference implementations.
