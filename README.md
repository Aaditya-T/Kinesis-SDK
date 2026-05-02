# Kinesis SDK

> **DynamicNFT Gaming SDK for the XRP Ledger.** Mint, mutate, transfer, and burn game NFTs whose on-chain URI can be updated after issuance via `NFTokenModify`. Pluggable storage and IPFS adapters. Self-host the lib in Node.js or run the standalone HTTP server for engines that can't import JavaScript (Unity, Unreal, native mobile).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

This monorepo contains the core SDK plus its adapter packages, a self-hostable REST server, and a documentation showcase site.

## Packages

All packages are published to npm under unscoped names.

| Package | What it does |
| --- | --- |
| [`xrpl-gaming-core`](./lib/xrpl-gaming-core) | The `XRPLGamingSDK` class plus pluggable `IDBAdapter` and `IIPFSAdapter` interfaces. Everything the other packages plug into. |
| [`xrpl-gaming-db-postgres`](./lib/xrpl-gaming-db-postgres) | PostgreSQL storage adapter. Auto-creates a single table on first run. |
| [`xrpl-gaming-db-mongodb`](./lib/xrpl-gaming-db-mongodb) | MongoDB storage adapter. Single collection per project. |
| [`xrpl-gaming-ipfs-pinata`](./lib/xrpl-gaming-ipfs-pinata) | Pinata IPFS adapter for uploading mutable NFT metadata. |
| [`xrpl-gaming-server`](./lib/xrpl-gaming-server) | Self-hostable HTTP/REST server that wraps the SDK. Use it from non-JavaScript engines. Ships a `xrpl-gaming-server` CLI binary and a Docker Compose example. |

## Install

Pick one storage adapter and the IPFS adapter, plus core:

```bash
npm install xrpl-gaming-core xrpl-gaming-db-postgres xrpl-gaming-ipfs-pinata
# or
pnpm add xrpl-gaming-core xrpl-gaming-db-postgres xrpl-gaming-ipfs-pinata
```

> **Requirements**: Node.js 18.17+. All packages are **ESM-only** (`"type": "module"`) — they are intended to be `import`ed, not `require`d. If your project still uses CommonJS, use a dynamic `import()` or migrate to ESM.

## Quick start (in-process, Node.js)

```ts
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PostgresAdapter } from "xrpl-gaming-db-postgres";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://s.altnet.rippletest.net:51233",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});

await sdk.init();

const { record, txHash } = await sdk.nft.mint({
  metadata: { name: "Wandering Knight", class: "warrior", level: 1 },
  playerId: "player-123",
  collection: "characters",
});

// Later — level up. Updates the on-chain URI via NFTokenModify.
// By default the SDK queries the Clio `nft_info` RPC to find the
// current owner so it can attach the XLS-46 `Owner` field on
// player-held NFTs.if you
// run a rippled-only node, pass `ownerSource: "db"` and reconcile
// owners with `sdk.nft.markTransferComplete()` yourself.
await sdk.nft.update(record.tokenId, {
  metadata: { ...record.metadata, level: 2 },
});
```

See the per-package READMEs for full API surface.

## Standalone REST server (Unity, Unreal, native mobile)

If your client cannot import the Node.js SDK, run the bundled server instead:

```bash
npm install -g xrpl-gaming-server
cp node_modules/xrpl-gaming-server/.env.example .env
# edit .env: SERVER_API_KEY, XRPL_ISSUER_SEED, PINATA_JWT, DATABASE_URL
xrpl-gaming-server
```

Or use the Docker Compose example shipped in the package
(`node_modules/xrpl-gaming-server/docker-compose.example.yml`) to spin up
Postgres + the server together.

Routes:

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/nft/mint` | `{ metadata, playerId, collection?, destination?, amount?, expiration? }` |
| `PATCH` | `/nft/:tokenId` | `{ metadata, taxon? }` |
| `POST` | `/nft/:tokenId/transfer` | `{ destination, amount? }` |
| `DELETE` | `/nft/:tokenId` | – |
| `GET` | `/nft/:tokenId` | – |
| `GET` | `/health` | – |

Every route requires an `x-api-key` header that matches `SERVER_API_KEY`.

## Live documentation

Long-form docs (architecture, every code sample, package walkthroughs) live in
the showcase site. Run it locally:

```bash
pnpm install
pnpm --filter @workspace/showcase run dev
# then open http://localhost:20059/docs
```

## Repo layout

```
lib/                    # publishable workspace packages
  xrpl-gaming-core/
  xrpl-gaming-db-postgres/
  xrpl-gaming-db-mongodb/
  xrpl-gaming-ipfs-pinata/
  xrpl-gaming-server/
  api-spec/             # internal — OpenAPI source, drives codegen
  api-zod/              # internal — generated Zod schemas
  api-client-react/     # internal — generated React Query hooks
  db/                   # internal — Drizzle schema for the demo api-server
artifacts/
  api-server/           # demo OpenAPI backend (consumes lib/api-zod, lib/db)
  showcase/             # marketing + docs site
```

The four `lib/api-*` and `lib/db` packages are workspace-internal, marked
`private: true`, and are not published to npm. They power the demo
`api-server` and the showcase site, not the SDK itself.

## Develop

```bash
pnpm install
pnpm run typecheck       # tsc --build across all packages
pnpm run build:sdk       # build the 5 publishable SDK packages
pnpm run build           # typecheck + build everything (libs + artifacts)
```

## Publishing

The 5 SDK packages share a coordinated release. Bump versions, then:

```bash
pnpm run build:sdk
pnpm -r --filter "./lib/xrpl-gaming-*" publish --access public --no-git-checks
```

`pnpm publish` rewrites `workspace:*` deps to the matching real version.

## License

[MIT](./LICENSE) © Aaditya T
