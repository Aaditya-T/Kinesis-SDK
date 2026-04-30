/**
 * Pricing tiers shown on the showcase page. Two tiers today; the managed
 * tier is "contact us" only because there's no payment integration yet.
 */

export interface PricingTier {
  id: "self-hosted" | "managed";
  name: string;
  price: string;
  priceCadence?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  /** Highlighted = the visually emphasized tier on the page. */
  highlighted?: boolean;
}

export const pricingTiers: PricingTier[] = [
  {
    id: "self-hosted",
    name: "Self-hosted",
    price: "Free",
    priceCadence: "forever",
    tagline:
      "Install the SDK, bring your own XRPL wallet, your own database, and your own Pinata IPFS account. You own everything.",
    features: [
      "Full SDK source on GitHub",
      "Mint, update, transfer, burn — all DynamicNFT primitives",
      "Postgres + Pinata adapters included out of the box",
      "Self-hostable REST server with Docker Compose",
      "Unity, Discord, browser, and Node.js examples",
      "Issue NFTs on testnet or mainnet — your call",
    ],
    cta: {
      label: "Get the SDK on GitHub",
      href: "https://github.com/Aaditya-T/Kinesis-SDK",
    },
  },
  {
    id: "managed",
    name: "Managed",
    price: "Custom",
    priceCadence: "talk to us",
    tagline:
      "We host the XRPL gateway, the IPFS pinning, and the database. You ship a single API key into your game build and we keep it running.",
    features: [
      "Hosted XRPL gateway across testnet + mainnet",
      "Managed IPFS pinning — no Pinata account needed",
      "Per-player short-lived tokens for browser & mobile builds",
      "Usage dashboard with mint / update / transfer counts",
      "Priority support — direct line to the maintainers",
      "SLA-backed uptime for your live game",
    ],
    cta: { label: "Contact us", href: "mailto:info@blockcelerate.net" },
    highlighted: true,
  },
];
