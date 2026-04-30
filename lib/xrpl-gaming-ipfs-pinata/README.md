# xrpl-gaming-ipfs-pinata

Pinata IPFS adapter for the XRPL Gaming SDK. Pins NFT metadata JSON **and** the binary assets it points at (images, audio, video) to Pinata, and returns a public IPFS URI plus a gateway URL for each.

> Adapters are a self-hosted concern. The managed tier (when available) will provide pinning out of the box and you will not instantiate this adapter directly.

Supports either:

- **JWT** (preferred) — uses Pinata's [v3 Files API](https://ai-docs.pinata.cloud/).
- **API key + secret key** (legacy) — uses Pinata's v1 `pinJSONToIPFS` endpoint.

Both modes pin the metadata to the public IPFS network and return the same shape.

## Install

```bash
pnpm add xrpl-gaming-ipfs-pinata
```

## Usage with a JWT (recommended)

Get a JWT from https://app.pinata.cloud/developers/api-keys, then:

```ts
import { XRPLGamingSDK } from "xrpl-gaming-core";
import { PinataAdapter } from "xrpl-gaming-ipfs-pinata";

const ipfs = new PinataAdapter({
  jwt: process.env.PINATA_JWT!,
  // Optional — recommended in production: use your dedicated gateway domain
  gatewayDomain: "your-team.mypinata.cloud",
});

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://xrplcluster.com",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  db: yourDbAdapter,
  ipfs,
});
```

## Usage with an API key + secret key (legacy)

```ts
const ipfs = new PinataAdapter({
  apiKey: process.env.PINATA_API_KEY!,
  secretKey: process.env.PINATA_SECRET_KEY!,
});
```

## Standalone usage

### Pin a JSON metadata document

```ts
const result = await ipfs.uploadJson(
  { name: "Hero", level: 1 },
  { name: "hero.json" },
);

console.log(result.uri);          // ipfs://bafy...
console.log(result.gatewayUrl);   // https://gateway.pinata.cloud/ipfs/bafy...
console.log(result.cid);          // bafy...
```

### Pin a binary file (image, audio, video)

NFT metadata documents typically reference an image by URI. Use `uploadFile` to pin the asset first, embed the returned `ipfs://` URI in the metadata, and then pin the metadata with `uploadJson` (or hand it directly to `sdk.nft.mint`).

```ts
import { promises as fs } from "node:fs";

// 1. Pin the image
const bytes = await fs.readFile("./hero.png");
const image = await ipfs.uploadFile(bytes, {
  name: "hero.png",
  contentType: "image/png",
});

// 2. Mint with the image embedded in the metadata
const minted = await sdk.nft.mint({
  metadata: {
    name: "Hero",
    image: image.uri,         // <- ipfs://bafy...
    attributes: { level: 1 },
  },
  playerId: "player-123",
});
```

`uploadFile` accepts `Uint8Array`, `ArrayBuffer`, `Blob`, or a Node `Buffer` (which extends `Uint8Array`). It returns the same `{ uri, gatewayUrl, cid }` shape as `uploadJson`. Always pass `contentType` so gateways serve the right MIME type — defaults to `application/octet-stream` otherwise.

Behind the scenes, JWT credentials hit Pinata's v3 `/v3/files` endpoint (the same endpoint `uploadJson` uses), and legacy API key + secret credentials hit `pinFileToIPFS` instead of `pinJSONToIPFS`.

## Configuration

Provide **either** `{ jwt }` **or** `{ apiKey, secretKey }`:

| Option | Default | Description |
|--------|---------|-------------|
| `jwt` | — | Pinata JWT from the API Keys page (uses v3 Files API) |
| `apiKey` + `secretKey` | — | Legacy key pair (uses v1 `pinJSONToIPFS`) |
| `gatewayDomain` | `gateway.pinata.cloud` | Domain used to build the gateway URL |
| `uploadEndpoint` | v3 or v1 endpoint depending on creds | Override for testing or self-hosting |
| `network` | `"public"` | JWT-only — `"public"` pins to public IPFS, `"private"` keeps it on Pinata |
