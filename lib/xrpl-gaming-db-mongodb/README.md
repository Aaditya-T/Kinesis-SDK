# xrpl-gaming-db-mongodb

MongoDB adapter for the XRPL Gaming SDK. Stores NFT records in a single auto-indexed collection.

> Adapters are a self-hosted concern. The managed tier (when available) will provide storage out of the box and you will not instantiate this adapter directly.

## Install

```bash
pnpm add xrpl-gaming-db-mongodb
```

## Usage

```ts
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { MongoAdapter } from "xrpl-gaming-db-mongodb";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://xrplcluster.com",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new MongoAdapter({
    connectionString: process.env.MONGODB_URL!,
    databaseName: "my_game",
    // Optional — defaults to "xrpl_gaming_nfts"
    collectionName: "characters",
  }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});

await sdk.init();
```

`init()` connects the client and creates indexes on `playerId`, `ownerAddress`, and `collection`.

## Schema

NFT records are stored as documents shaped like:

```json
{
  "_id": "00080000ABCDEF...",
  "ownerAddress": "rPlayerAddress...",
  "issuerAddress": "rIssuerAddress...",
  "metadataUri": "ipfs://bafy...",
  "metadata": { "name": "Hero", "level": 1 },
  "playerId": "player-123",
  "collection": "characters",
  "createdAt": "2026-04-27T00:00:00.000Z",
  "updatedAt": "2026-04-27T00:00:00.000Z"
}
```

The XRPL `NFTokenID` is used as the document `_id`, so reads are O(1).

## Sharing a client

If your app already maintains a `MongoClient`, pass it in to share the connection pool:

```ts
import { MongoClient } from "mongodb";

const client = await new MongoClient(process.env.MONGODB_URL!).connect();

const db = new MongoAdapter({
  connectionString: "",
  databaseName: "my_game",
  client,
});
```

When you provide your own client, `close()` does not disconnect it — your application is responsible for the client lifecycle.
