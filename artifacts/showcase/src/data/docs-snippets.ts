export const SNIPPETS = {
  install: `pnpm add xrpl-gaming-core \\
          xrpl-gaming-db-postgres \\
          xrpl-gaming-ipfs-pinata`,

  quickStart: `import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PostgresAdapter } from "xrpl-gaming-db-postgres";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://s.altnet.rippletest.net:51233",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({
    connectionString: process.env.DATABASE_URL!,
  }),
  ipfs: new PinataAdapter({
    jwt: process.env.PINATA_JWT!,
  }),
});

await sdk.init();

const result = await sdk.nft.mint({
  metadata: { name: "Mira", class: "Mage", level: 1 },
  playerId: "player-42",
  collection: "season-1",
});

console.log(result.record.tokenId);    // "00080000ABCD..."
console.log(result.record.metadataUri); // "ipfs://bafy..."`,

  walletMissing: `import { XRPLGamingSDK } from "xrpl-gaming-core";

// Throws synchronously in the constructor:
//   XrplGamingError:
//     Self-hosted SDK config requires \`xrpl.issuerWallet.seed\`
new XRPLGamingSDK({
  xrpl: { nodeUrl: "wss://s.altnet.rippletest.net:51233" } as never,
  db: undefined as never,
  ipfs: undefined as never,
});`,

  walletGenerate: `import { Wallet } from "xrpl";

// One-off, run locally and store the seed in a secret manager.
// Then fund it on testnet via https://faucet.altnet.rippletest.net
const issuer = Wallet.generate();
console.log("Address:", issuer.classicAddress);
console.log("Seed:   ", issuer.seed);
// Save the seed as XRPL_ISSUER_SEED in your env / secret store.`,

  managedAttempt: `// Managed mode is reserved for a future release.
// Passing \`managedApiKey\` today throws ManagedNotAvailableError —
// you must use a self-hosted config.
import { XRPLGamingSDK, ManagedNotAvailableError } from "xrpl-gaming-core";

try {
  new XRPLGamingSDK({ managedApiKey: "key_..." } as never);
} catch (e) {
  if (e instanceof ManagedNotAvailableError) {
    console.log("Use a self-hosted config instead.");
  }
}`,

  postgresAdapter: `import { PostgresAdapter } from "xrpl-gaming-db-postgres";

const db = new PostgresAdapter({
  connectionString: process.env.DATABASE_URL!,
  tableName: "xrpl_gaming_nfts", // optional; this is the default
  ssl: { rejectUnauthorized: false },
});

// Or reuse an existing pg.Pool from your application:
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dbShared = new PostgresAdapter({
  connectionString: "ignored-when-pool-passed",
  pool,
});`,

  mongoAdapter: `import { MongoAdapter } from "xrpl-gaming-db-mongodb";

const db = new MongoAdapter({
  connectionString: process.env.MONGO_URL!,
  databaseName: "kinesis",
  collectionName: "nfts", // optional
});`,

  customAdapter: `import type { IDBAdapter, NftRecord } from "xrpl-gaming-core";

class MyAdapter implements IDBAdapter {
  async init() { /* create tables / indexes */ }
  async close() { /* tear down */ }
  async saveNft(record: NftRecord) { /* INSERT */ }
  async updateNft(tokenId: string, partial: Partial<NftRecord>) { return null; }
  async getNft(tokenId: string) { return null; }
  async listNftsByPlayer(playerId: string) { return []; }
  async listNftsByOwner(ownerAddress: string) { return []; }
  async listNftsByCollection(collection: string) { return []; }
  async deleteNft(tokenId: string) { /* DELETE */ }
}`,

  pinataAdapter: `import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

// JWT (preferred) — generate one in your Pinata dashboard
const ipfs = new PinataAdapter({ jwt: process.env.PINATA_JWT! });

// Or legacy API key + secret (Pinata v1 endpoints)
const ipfsLegacy = new PinataAdapter({
  apiKey: process.env.PINATA_API_KEY!,
  secretKey: process.env.PINATA_SECRET_KEY!,
});

// Use a custom dedicated gateway for the public URL we hand back.
const ipfsCustom = new PinataAdapter({
  jwt: process.env.PINATA_JWT!,
  gatewayDomain: "your-gateway.mypinata.cloud",
});`,

  inProcessExpress: `import express from "express";
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PostgresAdapter } from "xrpl-gaming-db-postgres";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: process.env.XRPL_NODE!,
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});
await sdk.init();

const app = express();
app.use(express.json());

app.post("/loot", async (req, res) => {
  const { playerId, item } = req.body;
  const result = await sdk.nft.mint({
    metadata: item,
    playerId,
    collection: "loot-drops",
  });
  res.json(result);
});

app.listen(3000);`,

  standaloneServer: `import { createServer } from "xrpl-gaming-server";
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PostgresAdapter } from "xrpl-gaming-db-postgres";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: process.env.XRPL_NODE!,
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});
await sdk.init();

const app = createServer({
  sdk,
  apiKey: process.env.GAME_BACKEND_API_KEY!,
});

app.listen(8080, () => console.log("Kinesis API listening on :8080"));`,

  serverCurl: `# Mint a new NFT for a player
curl -X POST http://localhost:8080/nft/mint \\
  -H "x-api-key: $GAME_BACKEND_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "metadata": { "name": "Sword of Dawn", "level": 1 },
    "playerId": "player-42",
    "collection": "loot-drops"
  }'

# Mutate it later (PATCH, not POST)
curl -X PATCH http://localhost:8080/nft/$TOKEN_ID \\
  -H "x-api-key: $GAME_BACKEND_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "metadata": { "name": "Sword of Dawn", "level": 2 } }'

# Read it back
curl http://localhost:8080/nft/$TOKEN_ID \\
  -H "x-api-key: $GAME_BACKEND_API_KEY"`,

  browserClient: `// In your game client (web, Phaser, Discord embed, etc.)
const API_BASE = "https://api.your-game.com"; // your own backend
const PLAYER_TOKEN = await getPlayerSessionToken();

async function mintLoot(item: { name: string; rarity: string }) {
  const res = await fetch(\`\${API_BASE}/loot\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${PLAYER_TOKEN}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error(\`Mint failed: \${res.status}\`);
  return res.json();
}`,

  flowMint: `const result = await sdk.nft.mint({
  metadata: {
    name: "Mira",
    class: "Mage",
    level: 1,
    image: "ipfs://bafy.../mira.png",
  },
  // Optional: tag who owns it in your game
  playerId: "player-42",
  collection: "season-1",
  // Optional: flags (default both true)
  transferable: true,
  mutable: true,
  // Optional: organize on-ledger
  taxon: 100,
  // Optional: royalty in 0.01% units (250 = 2.5%)
  transferFee: 250,
  // Optional: also create a 0-drops sell offer to this address
  destination: "rPlayerXrplAddress...",
});

console.log(result.record.tokenId);   // 00080000...
console.log(result.record.metadataUri); // ipfs://bafy...
console.log(result.offerId);            // present iff destination was set`,

  flowUpdate: `const updated = await sdk.nft.update(result.record.tokenId, {
  metadata: {
    ...result.record.metadata,
    level: 2,
    xp: 1500,
  },
});

console.log(updated.record.metadataUri); // new ipfs://...
console.log(updated.txHash);             // NFTokenModify tx hash

// Internally:
//  1. Re-uploads the new metadata JSON to IPFS (new CID)
//  2. Submits an NFTokenModify transaction with the new URI
//  3. Updates the DB record so reads return the new state immediately`,

  flowTransfer: `// Two-step XRPL transfer: issuer creates a sell offer,
// player accepts it from their wallet.
const offer = await sdk.nft.transfer(tokenId, {
  destination: "rPlayerXrplAddress...",
  // amount: "0", // optional — defaults to a 0-drops free transfer
});

console.log(offer.offerId); // 0xABCD... — hand to the player
console.log(offer.txHash);  // NFTokenCreateOffer tx hash

// The player calls NFTokenAcceptOffer from their own wallet
// (Xumm, Crossmark, etc.) using offer.offerId. Once they do,
// call sdk.nft.markTransferComplete(tokenId, newOwner) so the
// DB record reflects the new owner.`,

  flowBurn: `const { txHash } = await sdk.nft.burn(tokenId);
// Submits NFTokenBurn, then deletes the record from your DB.`,

  flowQuery: `// All of these hit your DB, not the ledger — fast and cheap.
const playerInventory = await sdk.nft.listByPlayer("player-42");
const ownerHolds      = await sdk.nft.listByOwner("rPlayer...");
const seasonOne       = await sdk.nft.listByCollection("season-1");
const single          = await sdk.nft.get(tokenId);`,

  errors: `import {
  XrplGamingError,
  XrplTransactionError,
  ManagedNotAvailableError,
} from "xrpl-gaming-core";

try {
  await sdk.nft.mint({ metadata: { name: "Sword" } });
} catch (err) {
  if (err instanceof XrplTransactionError) {
    // The XRPL rejected the tx — err.txResult is the engine result
    // code (e.g. "tecINSUFFICIENT_RESERVE", "tecNO_PERMISSION").
    console.error("XRPL refused the tx:", err.txResult);
  } else if (err instanceof ManagedNotAvailableError) {
    // You passed { managedApiKey } but managed mode isn't shipped yet.
    console.error("Use a self-hosted config instead.");
  } else if (err instanceof XrplGamingError) {
    // Base class — covers misconfiguration, missing init(),
    // IPFS upload failures, DB errors, missing token IDs, etc.
    console.error(err.message);
  } else {
    throw err;
  }
}`,

  reactClient: `import {
  setBaseUrl,
  setAuthTokenGetter,
  useHealthCheck,
} from "@workspace/api-client-react";

// Wire the client to your backend once on app boot.
setBaseUrl("https://api.your-game.com");
setAuthTokenGetter(async () => getPlayerSessionToken());

// Every operation in the OpenAPI spec gets a generated React Query
// hook. The current spec only ships /healthz, so today you get:
function StatusBadge() {
  const { data, isLoading } = useHealthCheck();
  if (isLoading) return <span>...</span>;
  return <span>{data?.status === "ok" ? "Online" : "Down"}</span>;
}

// To get useMint / useGetNft / useListByPlayer hooks, add the
// corresponding endpoints to lib/api-spec/openapi.yaml and re-run
// the codegen:
//   pnpm --filter @workspace/api-spec run codegen
// Hooks are then re-emitted into lib/api-client-react/src/generated/.`,

  types: `// All of these are exported from xrpl-gaming-core

interface SelfHostedConfig {
  xrpl: {
    nodeUrl: string;
    issuerWallet: { seed: string };
    networkId?: number;
  };
  db: IDBAdapter;
  ipfs: IIPFSAdapter;
}

interface MintParams {
  metadata: NftMetadata;
  playerId?: string;
  collection?: string;
  transferable?: boolean; // default true
  mutable?: boolean;      // default true
  taxon?: number;
  transferFee?: number;
  destination?: string;
}
interface UpdateParams   { metadata: NftMetadata; }
interface TransferParams { destination: string; amount?: string; }

interface NftRecord {
  tokenId: string;
  ownerAddress: string;
  issuerAddress: string;
  metadataUri: string;
  metadata: NftMetadata;
  playerId: string | null;
  collection: string | null;
  // Set by mint({ destination }) and transfer(); cleared by
  // markTransferComplete() once the player accepts the offer.
  pendingOfferId: string | null;
  pendingDestination: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MintResult     { record: NftRecord; txHash: string; offerId?: string; }
interface UpdateResult   { record: NftRecord; txHash: string; }
interface TransferResult { offerId: string;   txHash: string; }
interface BurnResult     { txHash: string; }`,

  composeArchitecture: `┌──────────────────────────────────────────────────────┐
│  Your game client                                    │
│  (Unity, Phaser, browser, Discord bot, mobile app)   │
└──────────────────────┬───────────────────────────────┘
                       │   HTTPS + your own auth
                       ▼
┌──────────────────────────────────────────────────────┐
│  Your game backend                                   │
│  └─ embeds xrpl-gaming-core directly,     │
│     OR proxies to xrpl-gaming-server      │
└──────────────────────┬───────────────────────────────┘
                       │   in-process method calls
                       ▼
┌──────────────────────────────────────────────────────┐
│  XRPLGamingSDK  (signs every tx with issuer wallet)  │
└────┬───────────────────┬───────────────────┬─────────┘
     │                   │                   │
     ▼                   ▼                   ▼
┌──────────┐      ┌─────────────┐    ┌────────────────┐
│  XRPL    │      │ IDBAdapter  │    │ IIPFSAdapter   │
│  node    │      │ (Postgres / │    │ (Pinata /      │
│ (testnet │      │  Mongo /    │    │  custom)       │
│  / main) │      │  custom)    │    │                │
└──────────┘      └─────────────┘    └────────────────┘`,
};
