# @workspace/xrpl-gaming-db-postgres

PostgreSQL adapter for the XRPL Gaming SDK. Stores NFT records in a single auto-managed table.

> Adapters are a self-hosted concern. The managed tier (when available) will provide storage out of the box and you will not instantiate this adapter directly.

## Install

```bash
pnpm add @workspace/xrpl-gaming-db-postgres
```

## Usage

```ts
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PostgresAdapter } from "@workspace/xrpl-gaming-db-postgres";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://xrplcluster.com",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({
    connectionString: process.env.DATABASE_URL!,
    // Optional — defaults to "xrpl_gaming_nfts"
    tableName: "my_game_nfts",
    // Optional — for managed Postgres providers like Neon/Supabase that need TLS
    ssl: { rejectUnauthorized: false },
  }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});

await sdk.init();
```

`init()` runs `CREATE TABLE IF NOT EXISTS` and the supporting indexes — no separate migration step is required for first-time setup.

## Schema

The adapter manages a single table:

```sql
CREATE TABLE xrpl_gaming_nfts (
  token_id            TEXT PRIMARY KEY,
  owner_address       TEXT NOT NULL,
  issuer_address      TEXT NOT NULL,
  metadata_uri        TEXT NOT NULL,
  metadata            JSONB NOT NULL,
  player_id           TEXT,
  collection          TEXT,
  pending_offer_id    TEXT,        -- outstanding NFTokenCreateOffer awaiting acceptance
  pending_destination TEXT,        -- intended recipient for the pending offer
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX xrpl_gaming_nfts_player_idx     ON xrpl_gaming_nfts (player_id);
CREATE INDEX xrpl_gaming_nfts_owner_idx      ON xrpl_gaming_nfts (owner_address);
CREATE INDEX xrpl_gaming_nfts_collection_idx ON xrpl_gaming_nfts (collection);
```

`init()` also runs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for the `pending_offer_id` / `pending_destination` columns so older installations are upgraded in place.

## Sharing a pool

If your application already manages a `pg.Pool`, pass it in to avoid double-pooling:

```ts
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const db = new PostgresAdapter({ connectionString: "", pool });
```

When you provide your own pool, `close()` does not end it — your application is responsible for the pool lifecycle.
