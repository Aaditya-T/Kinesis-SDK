# @workspace/xrpl-gaming-ipfs-pinata

Pinata IPFS adapter for the XRPL Gaming SDK. Uploads NFT metadata JSON to Pinata and returns a public IPFS URI plus a gateway URL.

Supports either:

- **JWT** (preferred) — uses Pinata's [v3 Files API](https://ai-docs.pinata.cloud/).
- **API key + secret key** (legacy) — uses Pinata's v1 `pinJSONToIPFS` endpoint.

Both modes pin the metadata to the public IPFS network and return the same shape.

## Install

```bash
pnpm add @workspace/xrpl-gaming-ipfs-pinata
```

## Usage with a JWT (recommended)

Get a JWT from https://app.pinata.cloud/developers/api-keys, then:

```ts
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";

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

You can also use the adapter on its own:

```ts
const result = await ipfs.uploadJson(
  { name: "Hero", level: 1 },
  { name: "hero.json" },
);

console.log(result.uri);          // ipfs://bafy...
console.log(result.gatewayUrl);   // https://gateway.pinata.cloud/ipfs/bafy...
console.log(result.cid);          // bafy...
```

## Configuration

Provide **either** `{ jwt }` **or** `{ apiKey, secretKey }`:

| Option | Default | Description |
|--------|---------|-------------|
| `jwt` | — | Pinata JWT from the API Keys page (uses v3 Files API) |
| `apiKey` + `secretKey` | — | Legacy key pair (uses v1 `pinJSONToIPFS`) |
| `gatewayDomain` | `gateway.pinata.cloud` | Domain used to build the gateway URL |
| `uploadEndpoint` | v3 or v1 endpoint depending on creds | Override for testing or self-hosting |
| `network` | `"public"` | JWT-only — `"public"` pins to public IPFS, `"private"` keeps it on Pinata |
