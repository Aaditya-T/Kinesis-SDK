# xrpl-gaming-core

The core of the XRPL Gaming SDK. Provides the `XRPLGamingSDK` class and the pluggable adapter interfaces (`IDBAdapter`, `IIPFSAdapter`) that power it.

## Install

```bash
pnpm add xrpl-gaming-core xrpl-gaming-ipfs-pinata xrpl-gaming-db-postgres
```

## Self-hosted usage

You bring your own XRPL wallet seed, XRPL node URL, database, and Pinata account. The SDK glues them together.

```ts
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";
import { PostgresAdapter } from "xrpl-gaming-db-postgres";

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
import { XRPLGamingSDK } from "xrpl-gaming-core";

// Will throw ManagedNotAvailableError until the hosted backend is online.
const sdk = new XRPLGamingSDK({ managedApiKey: "xg_live_xxx" });
```

## DynamicNFT details

### Mint flags

`mint()` exposes the four `NFTokenMint` flags that matter for game NFTs. All are optional booleans on `MintParams`:

| `MintParams` field | XRPL flag        | Default | Effect                                                                  |
| ------------------ | ---------------- | ------- | ----------------------------------------------------------------------- |
| `transferable`     | `tfTransferable` | `true`  | NFT can be traded between non-issuer wallets.                           |
| `mutable`          | `tfMutable`      | `true`  | Issuer can later call `update()` (XLS-46). `false` freezes the NFT.     |
| `burnable`         | `tfBurnable`     | `false` | Issuer can burn the NFT even after a player owns it.                    |
| `onlyXRP`          | `tfOnlyXRP`      | `false` | Sell/buy offers for the NFT must be denominated in XRP, not IOUs.       |

### Updating a player-held NFT

`update()` issues an `NFTokenModify` transaction that replaces the URI with a new IPFS pointer. XLS-46 requires this transaction to carry an `Owner` field whenever the issuer is acting on a token they no longer hold (typical once a player has accepted the sell offer). The SDK attaches `Owner` automatically by resolving the current holder from one of two sources, controlled by `UpdateParams.ownerSource`:

- `"onchain"` **(default)** — the SDK queries the XRPL via the Clio-only [`nft_info`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/clio-methods/nft_info) RPC. Always correct, costs one extra request per update. **Requires the SDK's `nodeUrl` to point at a Clio server** — most public XRPL clusters expose Clio (e.g. `wss://xrplcluster.com`, `wss://s1.ripple.com`, `wss://s2.ripple.com`). If you self-host a rippled-only node and the call fails, the SDK throws an `XrplGamingError` that explicitly tells you to either run Clio or switch to `"db"`.
- `"db"` — the SDK trusts `ownerAddress` on its DB record. Skips the network round-trip, but only safe if you reliably call `sdk.nft.markTransferComplete(tokenId, newOwner)` after every accepted sell offer. Otherwise the modify will be rejected with `tecNO_ENTRY` / `tecNO_PERMISSION`.

```ts
// Default — works against any Clio-fronted XRPL node:
await sdk.nft.update(tokenId, { metadata: { ...newAttrs } });

// Opt out of the network call — your app guarantees DB freshness:
await sdk.nft.update(tokenId, { metadata: { ...newAttrs }, ownerSource: "db" });
```

### Transfer

Transfers use `NFTokenCreateOffer` (sell offer at 0 drops by default) targeted to the destination wallet, which must accept the offer to complete the transfer. The SDK does not poll the ledger; reconcile via `markTransferComplete()` once you observe acceptance.

## IPFS adapter capabilities

`IIPFSAdapter` exposes two methods:

- `uploadJson(metadata, opts?)` — pin a JSON metadata document. Used by `nft.mint` / `nft.update` internally; you rarely call it directly.
- `uploadFile(data, opts?)` — pin a binary file (image, audio, video). Use it to pin an NFT's image first, embed the returned `ipfs://` URI in the metadata, then mint:

  ```ts
  import { promises as fs } from "node:fs";

  const bytes = await fs.readFile("./hero.png");
  const image = await sdk.ipfs.uploadFile(bytes, {
    name: "hero.png",
    contentType: "image/png",
  });

  await sdk.nft.mint({
    metadata: { name: "Hero", image: image.uri, attributes: { level: 1 } },
    playerId: "player-123",
  });
  ```

  `data` accepts `Uint8Array`, `ArrayBuffer`, `Blob`, or a Node `Buffer`. Pass `contentType` so the asset is served with the right MIME type. Both bundled adapters (`xrpl-gaming-ipfs-pinata` and any custom one you implement) support both methods.

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

Implement `IDBAdapter` or `IIPFSAdapter` for any backend you like. See `xrpl-gaming-db-mongodb` and `xrpl-gaming-ipfs-pinata` for reference implementations.
