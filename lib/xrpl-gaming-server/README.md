# @workspace/xrpl-gaming-server

A self-hostable HTTP/REST server that exposes the XRPL DynamicNFT Gaming SDK over a simple JSON API. Designed for game studios on **non-JavaScript platforms** (Unity, Unreal, native mobile) that cannot import the Node.js SDK directly — they call this server instead.

> Adapters and the CLI are a self-hosted concern. The future managed tier will provide a hosted endpoint with the same API contract.

## What you get

- `POST /nft/mint` — mint a new DynamicNFT for a player
- `PATCH /nft/:tokenId` — update NFT metadata (the "dynamic" update)
- `POST /nft/:tokenId/transfer` — transfer NFT to another wallet (sell-offer based)
- `DELETE /nft/:tokenId` — burn an NFT
- `GET /nft/:tokenId` — fetch current NFT state and metadata
- `GET /health` — health probe (also requires `x-api-key`)
- `x-api-key` shared-secret auth on **every** route
- Zod-validated requests **and responses**, consistent JSON error envelope, pino structured logs

## Run it (5-minute path)

```bash
# 1. From the monorepo root
pnpm install
pnpm --filter @workspace/xrpl-gaming-server run build

# 2. Configure
cp lib/xrpl-gaming-server/.env.example lib/xrpl-gaming-server/.env
# edit .env — at minimum set SERVER_API_KEY, XRPL_ISSUER_SEED, PINATA_JWT

# 3. Start Postgres + the server
cd lib/xrpl-gaming-server
docker compose up -d
```

The server is now listening on `http://localhost:3000`.

### Run without docker

```bash
pnpm --filter @workspace/xrpl-gaming-server run build
DATABASE_URL=postgres://... \
SERVER_API_KEY=... \
XRPL_NODE_URL=wss://s.altnet.rippletest.net:51233 \
XRPL_ISSUER_SEED=sEd... \
PINATA_JWT=eyJ... \
PORT=3000 \
node --enable-source-maps lib/xrpl-gaming-server/dist/cli.mjs
```

## Environment variables

| Var | Required | Description |
|-----|----------|-------------|
| `PORT` | no (default `3000`) | HTTP listen port |
| `SERVER_API_KEY` | **yes** | Shared secret. Min 16 chars. Sent as `x-api-key` header. |
| `XRPL_NODE_URL` | **yes** | XRPL WebSocket node, e.g. `wss://s.altnet.rippletest.net:51233` |
| `XRPL_ISSUER_SEED` | **yes** | Family seed (`s...`) of the issuer wallet |
| `PINATA_JWT` | **yes** | Pinata JWT for IPFS pinning |
| `DATABASE_URL` | **yes** | Postgres connection string |
| `LOG_LEVEL` | no (default `info`) | pino log level |
| `NODE_ENV` | no | `production` disables pretty logs |

## API contract

All NFT endpoints require `x-api-key: <SERVER_API_KEY>`.

### `POST /nft/mint`

```http
POST /nft/mint
Content-Type: application/json
x-api-key: <key>

{
  "metadata": { "name": "Wandering Knight", "level": 1, "power": 50 },
  "playerId": "player-123",
  "collection": "characters",
  "destination": "rPlayerWalletAddress..."
}
```

```json
201 Created
{
  "record": {
    "tokenId": "00080000...",
    "ownerAddress": "rIssuer...",
    "issuerAddress": "rIssuer...",
    "metadataUri": "ipfs://Qm...",
    "metadata": { ... },
    "playerId": "player-123",
    "collection": "characters",
    "pendingOfferId": "ABCDEF...",
    "pendingDestination": "rPlayer...",
    "createdAt": "2026-04-27T00:00:00.000Z",
    "updatedAt": "2026-04-27T00:00:00.000Z"
  },
  "txHash": "...",
  "offerId": "ABCDEF..."
}
```

### `PATCH /nft/:tokenId`

```http
PATCH /nft/00080000.../
Content-Type: application/json
x-api-key: <key>

{ "metadata": { "name": "Wandering Knight", "level": 2, "power": 95 } }
```

Submits an `NFTokenModify` transaction (XLS-46 DynamicNFT). Returns the updated record + tx hash.

### `POST /nft/:tokenId/transfer`

```json
{ "destination": "rNewOwner...", "amount": "0" }
```

Creates a sell offer; the destination must accept it on-chain to complete the transfer. The DB row is annotated with `pendingOfferId` / `pendingDestination` until your application calls the SDK's `markTransferComplete()` helper to reconcile (the server does not currently expose a reconcile endpoint — coming in a follow-up).

### `DELETE /nft/:tokenId` / `GET /nft/:tokenId` / `GET /health`

Self-explanatory. `GET /health` returns `{ status: "ok", uptimeSeconds }`.

### Error envelope

All errors return:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

| HTTP | code | when |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Zod request validation failed |
| 400 | `SDK_ERROR` | SDK-level invariant violation (e.g. NFT not in DB) |
| 401 | `UNAUTHORIZED` | Missing/invalid `x-api-key` |
| 404 | `NOT_FOUND` | Unknown route or NFT id |
| 501 | `MANAGED_NOT_AVAILABLE` | Managed config used (always — hosted tier not shipped) |
| 502 | `XRPL_TX_FAILED` | XRPL rejected the transaction |
| 500 | `INTERNAL_ERROR` | Anything else |

## Calling from Unity (C#)

```csharp
using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class XrplNftClient : MonoBehaviour
{
    private const string ServerUrl = "http://localhost:3000";
    private const string ApiKey    = "your-server-api-key";

    [Serializable]
    private class MintBody
    {
        public Metadata metadata;
        public string playerId;
        public string collection;
        public string destination;
    }

    [Serializable]
    private class Metadata
    {
        public string name;
        public int level;
        public int power;
    }

    public IEnumerator MintNft()
    {
        var body = new MintBody
        {
            metadata    = new Metadata { name = "Wandering Knight", level = 1, power = 50 },
            playerId    = "player-123",
            collection  = "characters",
            destination = "rPlayerWalletAddress..."
        };
        var json = JsonUtility.ToJson(body);
        using var req = new UnityWebRequest($"{ServerUrl}/nft/mint", "POST");
        req.uploadHandler   = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("x-api-key", ApiKey);

        yield return req.SendWebRequest();
        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Mint failed: {req.error} — {req.downloadHandler.text}");
            yield break;
        }
        Debug.Log($"Minted: {req.downloadHandler.text}");
    }

    [Serializable]
    private class UpdateBody { public Metadata metadata; }

    public IEnumerator LevelUp(string tokenId, int newLevel, int newPower)
    {
        var body = new UpdateBody
        {
            metadata = new Metadata { name = "Wandering Knight", level = newLevel, power = newPower }
        };
        var json = JsonUtility.ToJson(body);
        using var req = new UnityWebRequest($"{ServerUrl}/nft/{tokenId}", "PATCH");
        req.uploadHandler   = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("x-api-key", ApiKey);

        yield return req.SendWebRequest();
        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Update failed: {req.error}");
            yield break;
        }
        Debug.Log($"Updated: {req.downloadHandler.text}");
    }
}
```

## Calling from anywhere (curl)

```bash
curl -X POST http://localhost:3000/nft/mint \
  -H "Content-Type: application/json" \
  -H "x-api-key: $SERVER_API_KEY" \
  -d '{"metadata":{"name":"Knight","level":1},"playerId":"p1"}'
```

## Programmatic use (TypeScript)

If you want to embed the server inside a larger Node service:

```ts
import { createServer } from "@workspace/xrpl-gaming-server";
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";
import { PostgresAdapter } from "@workspace/xrpl-gaming-db-postgres";

const sdk = new XRPLGamingSDK({
  xrpl: { nodeUrl: "wss://...", issuerWallet: { seed: "sEd..." } },
  db: new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
});
await sdk.init();

const app = createServer({ sdk, apiKey: process.env.SERVER_API_KEY! });
app.listen(3000);
```

## Out of scope (for now)

- OAuth / JWT / multi-tenant auth — only a single shared API key today
- Rate limiting, usage metering, billing — bring your own reverse proxy
- WebSocket / realtime ledger event streaming
- Hosted/managed deployment — that's the future paid tier
