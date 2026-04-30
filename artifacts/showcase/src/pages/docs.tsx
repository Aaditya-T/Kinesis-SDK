import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSidebar, DocsMobileToc } from "@/components/docs/DocsSidebar";
import { Section, Callout } from "@/components/docs/Section";
import { SNIPPETS } from "@/data/docs-snippets";
import { PACKAGES } from "@/data/packages";
import architectureDiagram from "@assets/image_1777534704458.png";

export default function Docs() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 pt-28">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to overview
          </Link>
          <div className="mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              Documentation
            </div>
            <img
              src="/logo.png"
              alt="Kinesis logo"
              className="w-14 h-14 object-contain rounded-lg mb-4"
            />
            <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-4">
              The complete Kinesis SDK guide by Blockcelerate
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Everything you need to ship XRPL DynamicNFTs in your game — the package map, how the
              issuer wallet, database, and IPFS adapters fit together, hosting modes, and end-to-end
              code for every core flow.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex gap-12">
          <DocsSidebar />

          <article className="flex-1 min-w-0 pb-24">
            <DocsMobileToc />

            {/* OVERVIEW */}
            <Section id="overview" eyebrow="Getting started" title="Overview">
              <p>
                <strong>Kinesis SDK</strong> (shipped on npm under the{" "}
                <code>xrpl-gaming-*</code> packages) is a TypeScript toolkit for issuing and
                mutating <strong>DynamicNFTs (XLS-46)</strong> on the XRP Ledger. It is built for
                indie game studios who want on-chain assets that <em>change as players play</em>{" "}
                — without writing smart contracts, learning xrpl.js wire formats, or running a
                custodial service.
              </p>
              <p>What the SDK gives you, end-to-end:</p>
              <ul>
                <li>
                  A single <code>XRPLGamingSDK</code> class that mints, mutates, transfers, and
                  burns NFTs with one method call each.
                </li>
                <li>
                  Pluggable <strong>database adapters</strong> (Postgres, MongoDB, or your own) so
                  player inventories stay in <em>your</em> store — not a vendor's.
                </li>
                <li>
                  A pluggable <strong>IPFS adapter</strong> (Pinata out of the box) that pins
                  metadata JSON and gives back the <code>ipfs://</code> URI to put on-ledger.
                </li>
                <li>
                  An optional <strong>standalone REST server</strong> with auth and request
                  validation, so your Unity / Phaser / Discord bot client can talk HTTP instead of
                  embedding the SDK.
                </li>
                <li>
                  A generated <strong>React Query client</strong> for any UI on top of the API.
                </li>
              </ul>
              <Callout variant="info" title="A note on the name">
                Kinesis SDK is the public brand. On the wire and in npm, the packages currently
                ship as <code>xrpl-gaming-*</code> and the main class is{" "}
                <code>XRPLGamingSDK</code>. The two will reconcile in a future release; until then,
                use the package names you see in the install commands.
              </Callout>
            </Section>

            {/* ARCHITECTURE */}
            <Section id="architecture" title="Architecture at a glance">
              <p>
                Every operation flows through one place — the <code>XRPLGamingSDK</code> instance
                — which signs XRPL transactions with your <strong>issuer wallet</strong> and fans
                out to the DB and IPFS adapters you injected.
              </p>
              <img
                src={architectureDiagram}
                alt="Architecture diagram showing client, backend, SDK, XRPL node, DB adapter, and IPFS adapter flow"
                className="w-full rounded-xl border border-border/60 bg-card shadow-sm my-6"
              />
              <p>The four boundaries to remember:</p>
              <ul>
                <li>
                  <strong>Your game client</strong> never holds the issuer seed. It talks to{" "}
                  <em>your</em> backend, which holds the SDK.
                </li>
                <li>
                  <strong>The SDK</strong> is the only thing that signs on-ledger transactions.
                </li>
                <li>
                  <strong>Your DB</strong> mirrors NFT state for fast reads (inventory pages, leader
                  boards) — it is a cache and an index, not the source of truth. The ledger is.
                </li>
                <li>
                  <strong>IPFS</strong> stores the metadata JSON the on-ledger URI points to.
                </li>
              </ul>
            </Section>

            {/* QUICK START */}
            <Section id="quick-start" title="Quick start">
              <h3>1. Install</h3>
              <CodeBlock code={SNIPPETS.install} language="bash" />
              <h3>2. Mint your first NFT</h3>
              <CodeBlock code={SNIPPETS.quickStart} language="ts" filename="server.ts" />
              <p>
                On testnet that's enough to mint your first DynamicNFT. Fund the issuer wallet
                from the{" "}
                <a href="https://faucet.altnet.rippletest.net" target="_blank" rel="noreferrer">
                  XRPL testnet faucet
                </a>{" "}
                first if it's brand new — the SDK doesn't fund wallets for you.
              </p>
            </Section>

            {/* PACKAGES */}
            <Section id="packages" eyebrow="Packages" title="Package map">
              <p>
                The SDK is split into small packages so you only ship what you use. Every package
                works on its own, but they all compose around <code>xrpl-gaming-core</code>.
              </p>
              <div className="not-prose grid sm:grid-cols-2 gap-4 my-6">
                {PACKAGES.map((p) => (
                  <div
                    key={p.pkg}
                    className="flex flex-col gap-2 p-5 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-display font-semibold">{p.name}</span>
                      <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
                        {p.pkg}
                      </code>
                    </div>
                    <div className="text-sm font-medium text-foreground/90">{p.tagline}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                    <div className="text-xs text-muted-foreground/80 mt-1">
                      <span className="text-foreground/70">When to use:</span> {p.whenToUse}
                    </div>
                    {p.deps && (
                      <div className="text-xs text-muted-foreground/80">
                        <span className="text-foreground/70">Peer deps:</span>{" "}
                        <code className="font-mono">{p.deps.join(", ")}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* WALLET */}
            <Section id="wallet" eyebrow="Configuration" title="The issuer wallet">
              <p>
                The SDK is <strong>non-custodial by default</strong>. You provide an XRPL wallet
                seed (an <code>s...</code> family seed) for the wallet that will <em>issue</em> all
                NFTs in your game. Every mint, modify, transfer, and burn is signed by this
                wallet.
              </p>

              <h3>If you don't pass a seed</h3>
              <p>
                The constructor throws synchronously — the SDK refuses to even start without one,
                because every operation needs to sign something:
              </p>
              <CodeBlock code={SNIPPETS.walletMissing} language="ts" />

              <h3>Generating a wallet</h3>
              <p>
                For a fresh project, generate a wallet once locally and store the seed in your
                secret manager (Replit Secrets, AWS Secrets Manager, Doppler, etc.):
              </p>
              <CodeBlock code={SNIPPETS.walletGenerate} language="ts" filename="scripts/gen-wallet.ts" />

              <Callout variant="warn" title="Treat the seed like a database password">
                Anyone with the seed can mint, modify, and transfer every NFT in your collection.
                Never bundle it in a client build, never check it into git, and rotate it if it
                ever leaks (you can re-issue under a new wallet, but existing NFTs stay under the
                old one).
              </Callout>

              <h3>What about a managed mode?</h3>
              <p>
                A future managed tier will let you skip running an issuer wallet at all and pay
                per call. The constructor recognizes the option but rejects it today:
              </p>
              <CodeBlock code={SNIPPETS.managedAttempt} language="ts" />
            </Section>

            {/* DB ADAPTER */}
            <Section id="db-adapter" title="Database adapters">
              <p>
                The <code>db</code> field on the config takes anything implementing{" "}
                <code>IDBAdapter</code>. The SDK calls it on every mint / update / transfer / burn
                so your backend can answer "what does player X own?" in a single query — without
                paginating the ledger.
              </p>

              <h3>Postgres</h3>
              <CodeBlock code={SNIPPETS.postgresAdapter} language="ts" />

              <h3>MongoDB</h3>
              <CodeBlock code={SNIPPETS.mongoAdapter} language="ts" />

              <h3>Custom adapter</h3>
              <p>
                If you use SQLite, DynamoDB, or your in-house store, implement the interface
                directly:
              </p>
              <CodeBlock code={SNIPPETS.customAdapter} language="ts" />
              <Callout variant="tip" title="The DB is a mirror, not the source of truth">
                If your DB ever drifts, the on-ledger state always wins. The SDK persists the
                record <em>after</em> the XRPL transaction settles, so a crashed write is the only
                way they can disagree — and the data is recoverable from ledger history.
              </Callout>
            </Section>

            {/* IPFS ADAPTER */}
            <Section id="ipfs-adapter" title="IPFS via Pinata">
              <p>
                Every mint and update uploads a small JSON document (your NFT's metadata) to IPFS
                and writes the resulting <code>ipfs://CID</code> URI into the on-ledger NFT.
                That's how the NFT changes when the player levels up — the ledger URI moves to a
                new CID pointing at the new metadata.
              </p>
              <CodeBlock code={SNIPPETS.pinataAdapter} language="ts" />
              <p>The adapter returns:</p>
              <ul>
                <li>
                  <code>uri</code> — the canonical <code>ipfs://CID</code> string written to the
                  ledger
                </li>
                <li>
                  <code>gatewayUrl</code> — an HTTPS URL on Pinata's gateway (or your dedicated
                  gateway) so browsers can fetch it without an IPFS client
                </li>
                <li>
                  <code>cid</code> — the raw content ID
                </li>
              </ul>
              <p>
                Want a different pinning service (Web3.Storage, Filebase, your own IPFS node)?
                Implement the <code>IIPFSAdapter</code> interface — it's a single method,{" "}
                <code>uploadJson(data, opts)</code>.
              </p>
            </Section>

            {/* IN-PROCESS */}
            <Section id="in-process" eyebrow="Hosting" title="In-process Node.js">
              <p>
                The simplest deployment: import the SDK directly into your existing game backend
                (Express, Fastify, Hono, Nest, anything Node) and call methods. No extra service to
                run.
              </p>
              <CodeBlock code={SNIPPETS.inProcessExpress} language="ts" filename="game-backend/src/server.ts" />
              <p>
                Best when your game backend is already in TypeScript / Node and you don't want
                another network hop.
              </p>
            </Section>

            {/* STANDALONE SERVER */}
            <Section id="standalone-server" title="Standalone REST server">
              <p>
                If your game backend is in a different language (Go, Python, C# Unity server) or
                you want a clean service boundary, use{" "}
                <code>xrpl-gaming-server</code>. It wraps the SDK in an Express app
                with <code>x-api-key</code> auth and zod request validation:
              </p>
              <CodeBlock code={SNIPPETS.standaloneServer} language="ts" filename="kinesis-server/src/index.ts" />
              <p>Then talk to it from anything that speaks HTTP:</p>
              <CodeBlock code={SNIPPETS.serverCurl} language="bash" />
              <Callout variant="info" title="Routes you get for free">
                <code>POST /nft/mint</code>, <code>PATCH /nft/:tokenId</code>,{" "}
                <code>POST /nft/:tokenId/transfer</code>, <code>DELETE /nft/:tokenId</code>,{" "}
                <code>GET /nft/:tokenId</code>. Auth is the <code>x-api-key</code> header.
                List-by-player / collection are exposed on the in-process SDK today; if you
                need them over REST, mount your own Express route alongside the bundled
                router or contribute the endpoint upstream.
              </Callout>
            </Section>

            {/* BROWSER REST */}
            <Section id="browser-rest" title="Browsers & game clients">
              <p>
                <strong>Never embed the SDK in a client build.</strong> The issuer seed must stay
                server-side. From a browser, Phaser game, Unity WebGL build, Discord bot, or
                native mobile app, call your <em>own</em> backend (which embeds the SDK or proxies
                to the standalone server):
              </p>
              <CodeBlock code={SNIPPETS.browserClient} language="ts" filename="game-client/src/loot.ts" />
              <p>
                Your backend authenticates the player (session token, wallet signature, OAuth,
                whatever you use today), then forwards to the SDK with the player's ID attached so
                the resulting NFT is correctly tagged in your DB.
              </p>
            </Section>

            {/* FLOW: MINT */}
            <Section id="flow-mint" eyebrow="Core flows" title="Mint a DynamicNFT">
              <p>
                Mint is the only call that allocates a fresh <code>tokenId</code>. Under the hood
                the SDK:
              </p>
              <ol>
                <li>Uploads your metadata JSON to IPFS and gets a CID back.</li>
                <li>
                  Builds an <code>NFTokenMint</code> tx with the URI hex-encoded and the{" "}
                  <code>tfMutable</code> + <code>tfTransferable</code> flags set (by default).
                </li>
                <li>Autofills, signs, submits, and waits for ledger confirmation.</li>
                <li>Persists the resulting record to your DB.</li>
                <li>
                  Optionally creates a 0-drops sell offer if you passed{" "}
                  <code>destination</code>.
                </li>
              </ol>
              <CodeBlock code={SNIPPETS.flowMint} language="ts" />
            </Section>

            {/* FLOW: UPDATE */}
            <Section id="flow-update" title="Mutate (update) an NFT">
              <p>
                The DynamicNFT magic. Pass the new metadata; the SDK pins it to a fresh CID and
                submits an <code>NFTokenModify</code> tx so the on-ledger URI moves to the new
                pin. Anyone watching the token sees the change at the next ledger close.
              </p>
              <CodeBlock code={SNIPPETS.flowUpdate} language="ts" />
              <Callout variant="tip" title="Mutability is per-NFT">
                Mutability is decided at mint time via the <code>mutable</code> flag (default
                true). If you mint with <code>mutable: false</code>, future updates will fail
                with an XRPL error — that NFT is frozen forever.
              </Callout>
            </Section>

            {/* FLOW: TRANSFER */}
            <Section id="flow-transfer" title="Transfer to a player">
              <p>
                XRPL NFT transfer is a two-step handshake: the current owner creates a sell offer
                (the SDK does this for you, at 0 drops, for free transfers), and the recipient
                accepts it from their own wallet. This keeps transfers consensual and prevents
                spam.
              </p>
              <CodeBlock code={SNIPPETS.flowTransfer} language="ts" />
              <p>
                For convenience, the same destination shortcut is available on{" "}
                <code>mint()</code> — pass <code>destination</code> there and the SDK creates the
                offer in the same call.
              </p>
            </Section>

            {/* FLOW: BURN */}
            <Section id="flow-burn" title="Burn an NFT">
              <p>
                Permanently destroy an NFT (and reclaim the ledger reserve). The DB record is
                removed too.
              </p>
              <CodeBlock code={SNIPPETS.flowBurn} language="ts" />
            </Section>

            {/* FLOW: QUERY */}
            <Section id="flow-query" title="Query inventory">
              <p>
                All read operations go to your DB, not the ledger — they're cheap and fast enough
                to call on every page load.
              </p>
              <CodeBlock code={SNIPPETS.flowQuery} language="ts" />
              <Callout variant="info" title="Need ledger-truth queries?">
                Use <code>xrpl.js</code> directly with{" "}
                <code>account_nfts</code> against the issuer or owner address. The SDK's queries
                are intentionally backed by your DB for predictable latency.
              </Callout>
            </Section>

            {/* ERRORS */}
            <Section id="errors" eyebrow="Reference" title="Errors & recovery">
              <p>The SDK throws three error classes. Catch them narrowly:</p>
              <ul>
                <li>
                  <code>XrplGamingError</code> — misconfiguration, missing{" "}
                  <code>init()</code>, IPFS or DB failures.
                </li>
                <li>
                  <code>XrplTransactionError</code> — the ledger rejected the tx. Exposes a{" "}
                  <code>txResult</code> string (the engine result code, e.g.{" "}
                  <code>tecINSUFFICIENT_RESERVE</code>) so you can branch on it.
                </li>
                <li>
                  <code>ManagedNotAvailableError</code> — you tried to use the future managed
                  tier; switch to a self-hosted config.
                </li>
              </ul>
              <CodeBlock code={SNIPPETS.errors} language="ts" />
            </Section>

            {/* REACT CLIENT */}
            <Section id="react-client" title="React client hooks">
              <p>
                <code>@workspace/api-client-react</code> is generated from the OpenAPI spec at{" "}
                <code>lib/api-spec/openapi.yaml</code> — every operation in the spec gets a typed
                React Query hook plus a fetcher. Today the spec only declares the health check, so
                the package currently exports <code>useHealthCheck</code>, <code>setBaseUrl</code>,
                and <code>setAuthTokenGetter</code>. Add NFT operations to the spec and re-run{" "}
                <code>pnpm --filter @workspace/api-spec run codegen</code> to get matching{" "}
                <code>useMint</code> / <code>useGetNft</code> / <code>useListByPlayer</code> hooks.
              </p>
              <CodeBlock code={SNIPPETS.reactClient} language="tsx" filename="StatusBadge.tsx" />
            </Section>

            {/* TYPES */}
            <Section id="types" title="Types cheat sheet">
              <p>The shapes you'll touch most often:</p>
              <CodeBlock code={SNIPPETS.types} language="ts" />
            </Section>

            <div className="not-prose mt-16 p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-display font-semibold mb-1">Ready to ship?</div>
                <p className="text-sm text-muted-foreground">
                  Run the live demo to see a mint and an on-chain mutation end-to-end.
                </p>
              </div>
              <Link
                href="/#demo"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Try the demo
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

