/**
 * Hand-written code examples shown in the "Code Examples" section of the
 * showcase page. Kept in their own module so the design subagent can simply
 * map over them — no copy-paste of long string literals into JSX.
 *
 * Each `code` value is the literal source the user will read and copy. Be
 * conservative about edits — these are public-facing and people WILL
 * copy-paste them directly into their projects.
 */

export type CodeLanguage = "typescript" | "tsx" | "javascript" | "csharp" | "bash";

export interface CodeExample {
  /** Short id used as the tab key. */
  id: string;
  /** Tab label shown to the user. */
  label: string;
  /** One-line subtitle describing when you'd use this example. */
  description: string;
  /** Source language for syntax highlighting. */
  language: CodeLanguage;
  /** The raw source code. Indented with 2 spaces, no trailing newline. */
  code: string;
}

const nodeExample: CodeExample = {
  id: "node",
  label: "Node.js / HTML5",
  description:
    "Embed the SDK directly in a Node-based game server (HTML5, Phaser, PixiJS, custom).",
  language: "typescript",
  code: `import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";
import { PostgresAdapter } from "@workspace/xrpl-gaming-db-postgres";

const sdk = new XRPLGamingSDK({
  xrpl: {
    nodeUrl: "wss://s.altnet.rippletest.net:51233",
    issuerWallet: { seed: process.env.XRPL_ISSUER_SEED! },
  },
  ipfs: new PinataAdapter({ jwt: process.env.PINATA_JWT! }),
  db:   new PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
});
await sdk.init();

// Mint a fresh character NFT for a new player.
const { record, txHash } = await sdk.nft.mint({
  metadata: { name: "Sir Lancelot", class: "Knight", level: 1, power: 10 },
  playerId: "player_42",
});
console.log("Minted", record.tokenId, "tx", txHash);

// Later, when the player levels up — the same NFT is mutated on-chain.
await sdk.nft.update(record.tokenId, {
  metadata: { ...record.metadata, level: 2, power: 14 },
});`,
};

const discordExample: CodeExample = {
  id: "discord",
  label: "Discord Bot",
  description:
    "A discord.js slash-command handler that mints a character NFT to the player who runs it.",
  language: "typescript",
  code: `import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";

// Created once at bot startup — share across all command handlers.
const sdk = new XRPLGamingSDK({ /* ...adapters... */ });
await sdk.init();

export const data = new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Claim your starter character NFT");

export async function execute(i: ChatInputCommandInteraction) {
  await i.deferReply({ ephemeral: true });

  const { record } = await sdk.nft.mint({
    metadata: { name: i.user.username, class: "Recruit", level: 1, power: 5 },
    playerId: i.user.id,
  });

  await i.editReply(
    \`Minted your starter NFT! Token ID: \\\`\${record.tokenId}\\\`\`,
  );
}`,
};

const unityExample: CodeExample = {
  id: "unity",
  label: "Unity (C#)",
  description:
    "Call your self-hosted xrpl-gaming-server from Unity via UnityWebRequest. Works in WebGL, mobile, and standalone builds.",
  language: "csharp",
  code: `using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class XrplGamingClient : MonoBehaviour
{
    [SerializeField] private string serverUrl = "https://your-server.example.com";
    [SerializeField] private string apiKey   = "REPLACE_ME";

    public IEnumerator MintCharacter(string playerId)
    {
        var body = "{\\"metadata\\":{\\"name\\":\\"Knight\\",\\"class\\":\\"Knight\\",\\"level\\":1,\\"power\\":10},\\"playerId\\":\\""
                 + playerId + "\\"}";

        using var req = new UnityWebRequest(serverUrl + "/nft/mint", "POST");
        req.uploadHandler   = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("x-api-key", apiKey);

        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
            Debug.Log("Minted NFT: " + req.downloadHandler.text);
        else
            Debug.LogError("Mint failed: " + req.error);
    }
}`,
};

const browserExample: CodeExample = {
  id: "browser",
  label: "Browser (WebGL / fetch)",
  description:
    "Browser games (WebGL, Phaser, PlayCanvas) call the same self-hosted REST API with plain fetch.",
  language: "typescript",
  code: `// Important: never ship your API key in a client-side bundle. Instead,
// proxy these requests through your own backend (e.g. a thin /api/xrpl/*
// route on your game server) and forward the x-api-key header there.

interface MintResponse {
  record: {
    tokenId: string;
    ownerAddress: string;
    issuerAddress: string;
    metadataUri: string;
    metadata: unknown;
    playerId: string | null;
    collection: string | null;
    createdAt: string;
    updatedAt: string;
  };
  txHash: string;
}

async function mintCharacter(playerId: string): Promise<MintResponse> {
  // The self-hosted xrpl-gaming-server mounts routes at the root, so a
  // typical proxy maps /api/xrpl/* -> http://server:8080/*.
  const res = await fetch("/api/xrpl/nft/mint", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      metadata: { name: "Knight", class: "Knight", level: 1, power: 10 },
      playerId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? \`Mint failed: \${res.status}\`);
  }
  return (await res.json()) as MintResponse;
}`,
};

export const codeExamples: CodeExample[] = [
  nodeExample,
  discordExample,
  unityExample,
  browserExample,
];
