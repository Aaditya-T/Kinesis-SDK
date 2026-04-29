export interface PackageInfo {
  name: string;
  pkg: string;
  tagline: string;
  description: string;
  whenToUse: string;
  deps?: string[];
}

export const PACKAGES: PackageInfo[] = [
  {
    name: "Core",
    pkg: "xrpl-gaming-core",
    tagline: "The SDK itself.",
    description:
      "Wraps XRPL DynamicNFT operations (mint, modify, sell-offer, burn) behind a game-friendly facade and orchestrates the DB and IPFS adapters.",
    whenToUse: "Always. Every other package extends this one.",
    deps: ["xrpl"],
  },
  {
    name: "Postgres adapter",
    pkg: "xrpl-gaming-db-postgres",
    tagline: "Persist NFT records in PostgreSQL.",
    description:
      "Implements IDBAdapter against pg. Creates the xrpl_gaming_nfts table on init() (or you can pass an existing pool).",
    whenToUse: "You already run Postgres for your game backend.",
    deps: ["pg"],
  },
  {
    name: "MongoDB adapter",
    pkg: "xrpl-gaming-db-mongodb",
    tagline: "Persist NFT records in MongoDB.",
    description:
      "Implements IDBAdapter against the official mongodb driver. Stores one document per NFT and indexes playerId / ownerAddress / collection.",
    whenToUse: "You already run Mongo, or want a doc store for flexible metadata.",
    deps: ["mongodb"],
  },
  {
    name: "Pinata IPFS adapter",
    pkg: "xrpl-gaming-ipfs-pinata",
    tagline: "Pin NFT metadata JSON to IPFS via Pinata.",
    description:
      "Uploads metadata JSON on mint/update and returns a stable ipfs://CID URI plus a public HTTPS gateway URL. JWT or legacy API-key auth.",
    whenToUse: "Default choice unless you implement IIPFSAdapter against another pinning service.",
  },
  {
    name: "Standalone server",
    pkg: "xrpl-gaming-server",
    tagline: "Drop-in REST API in front of the SDK.",
    description:
      "Express app exposing POST /nft/mint, PATCH /nft/:tokenId, POST /nft/:tokenId/transfer, DELETE /nft/:tokenId, and GET /nft/:tokenId with x-api-key auth and zod request validation. Use it directly or mount its router into your own Express app.",
    whenToUse: "You want HTTP endpoints without writing controllers.",
    deps: ["express", "pino", "zod"],
  },
  {
    name: "React client",
    pkg: "@workspace/api-client-react",
    tagline: "Type-safe React Query hooks.",
    description:
      "Auto-generated from lib/api-spec/openapi.yaml via Orval. Currently exports useHealthCheck plus setBaseUrl / setAuthTokenGetter; extending the spec re-emits matching React Query hooks for every new operation.",
    whenToUse: "You're building a React UI on top of the REST API.",
    deps: ["@tanstack/react-query"],
  },
  {
    name: "API spec & schemas",
    pkg: "@workspace/api-spec / @workspace/api-zod",
    tagline: "OpenAPI source of truth + zod validators.",
    description:
      "api-spec holds the openapi.yaml; api-zod is the generated zod schema bundle the server uses to validate requests. The React client is generated from the same spec.",
    whenToUse: "Internal — only matters if you regenerate or extend the API surface.",
  },
];
