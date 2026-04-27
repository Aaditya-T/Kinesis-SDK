# @workspace/xrpl-gaming-ipfs-pinata

Pinata IPFS adapter for the XRPL Gaming SDK. Uploads NFT metadata JSON to Pinata's [v3 Files API](https://ai-docs.pinata.cloud/) and returns a public IPFS URI plus a gateway URL.

## Install

```bash
pnpm add @workspace/xrpl-gaming-ipfs-pinata
```

## Usage

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

| Option | Default | Description |
|--------|---------|-------------|
| `jwt` | required | Pinata JWT from the API Keys page |
| `gatewayDomain` | `gateway.pinata.cloud` | Domain used to build the gateway URL |
| `uploadEndpoint` | `https://uploads.pinata.cloud/v3/files` | Override for testing or self-hosting |
| `network` | `"public"` | `"public"` pins to public IPFS, `"private"` keeps it on Pinata only |
