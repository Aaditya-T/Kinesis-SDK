# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This project is the **Kineses SDK** (https://github.com/Aaditya-T/Kinesis-SDK), an XRPL DynamicNFT toolkit for indie game studios. It is split into 5 publishable packages under `lib/` (unscoped npm names, MIT, version 0.1.0):

- `xrpl-gaming-core` — `XRPLGamingSDK` class, `IDBAdapter` / `IIPFSAdapter` interfaces, NFT mint/update/transfer/burn flow. `mint()` accepts the four useful `NFTokenMint` flags (`transferable`, `mutable`, `burnable`, `onlyXRP`); the deprecated `tfTrustLine` is omitted on purpose. When `destination` is set, `mint()` packs the XLS-46 inline sell-offer fields (`Amount`, `Destination`, `Expiration`) onto the same `NFTokenMint` transaction so mint + offer settle in one ledger close — `amount` defaults to `"0"` drops, `expiration` accepts a JS `Date` or a Ripple-time number (converted via the exported `toRippleTime` helper), and the resulting `offerId` is extracted from the same transaction's metadata. `update()` auto-attaches the XLS-46 `Owner` field on `NFTokenModify` whenever the issuer no longer holds the NFT, resolving the current owner via Clio's `nft_info` RPC by default (`ownerSource: "onchain"` — requires a Clio-fronted XRPL node, which most public clusters are) and via the SDK's DB record on opt-in (`ownerSource: "db"`). If the default path can't reach Clio it throws an `XrplGamingError` that names both alternatives. `IIPFSAdapter` exposes both `uploadJson` (metadata) and `uploadFile` (binary assets — images, audio, video). The SDK also exposes `sdk.ipfs` so callers can pin assets ad-hoc before minting.
- `xrpl-gaming-ipfs-pinata` — Pinata IPFS adapter (v3 Files API). Implements both `uploadJson` and `uploadFile`; v1 (legacy keys) routes binaries to `pinFileToIPFS`.
- `xrpl-gaming-db-postgres` — PostgreSQL adapter (auto-creates table + indexes on `init()`).
- `xrpl-gaming-db-mongodb` — MongoDB adapter (auto-creates indexes on `init()`).
- `xrpl-gaming-server` — self-hostable Express server exposing the SDK over REST (`POST /nft/mint`, `PATCH /nft/:id`, `POST /nft/:id/transfer`, `DELETE /nft/:id`, `GET /nft/:id`, `GET /health`). API-key auth, Zod validation, pino logs, ships with `docker-compose.example.yml` + `.env.example` for 5-minute self-host. Bridge for Unity / Unreal / native mobile. Provides `xrpl-gaming-server` CLI binary.

The SDK is self-hosted by default; passing `{ managedApiKey }` throws `ManagedNotAvailableError` until the managed tier ships.

Each SDK package emits both `.js` and `.d.ts` to `dist/` via `tsc -p tsconfig.json` (server adds an esbuild step that overwrites `dist/cli.js` with a self-contained bundle that inlines pino transports). Source uses explicit `.js` extensions on relative imports for Node ESM compatibility; TypeScript's `moduleResolution: bundler` resolves them to `.ts` during typecheck.

The four `lib/api-*` and `lib/db` packages plus `artifacts/api-server` + `artifacts/showcase` are workspace-internal (`private: true`) and are not published.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: `tsc` for SDK packages; esbuild for the server CLI bundle and the demo api-server

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build:sdk` — build the 5 publishable SDK packages (`tsc` + server esbuild)
- `pnpm run build` — typecheck + build all packages (SDK + artifacts)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Publishing the SDK

```bash
pnpm run build:sdk
pnpm -r --filter "./lib/xrpl-gaming-*" publish --access public --no-git-checks
```

`pnpm publish` rewrites `workspace:*` deps to the matching real version.

## Showcase site (`artifacts/showcase`)

React + Vite + Tailwind v4 landing site for the Kineses SDK. Routes:

- `/` — marketing home (Hero, Features, live testnet Demo, CodeExamples, Pricing).
- `/docs` — full SDK guide with sticky sidebar nav, IntersectionObserver-based scroll-spy, Mermaid architecture chart (`MermaidChart` component, dark theme), package map, configuration / hosting / core-flow sections, and copy-to-clipboard code blocks (`prism-react-renderer`).

Brand surface (title, navbar/footer, contact email `hello@kineses.dev`, browser API base `api.kineses.dev`) is "Kineses SDK". Code examples reference the unscoped package names (`xrpl-gaming-*`) so users can copy-paste them directly after `npm install`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
