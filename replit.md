# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This project also contains the **XRPL DynamicNFT Gaming SDK**, split into pluggable packages under `lib/`:

- `@workspace/xrpl-gaming-core` — `XRPLGamingSDK` class, `IDBAdapter` / `IIPFSAdapter` interfaces, NFT mint/update/transfer/burn flow.
- `@workspace/xrpl-gaming-ipfs-pinata` — Pinata IPFS adapter (v3 Files API).
- `@workspace/xrpl-gaming-db-postgres` — PostgreSQL adapter (auto-creates table + indexes on `init()`).
- `@workspace/xrpl-gaming-db-mongodb` — MongoDB adapter (auto-creates indexes on `init()`).

The SDK is self-hosted by default; passing `{ managedApiKey }` throws `ManagedNotAvailableError` until the managed tier ships.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
