import { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { PinataAdapter } from "@workspace/xrpl-gaming-ipfs-pinata";
import { PostgresAdapter } from "@workspace/xrpl-gaming-db-postgres";
import pino from "pino";
import { createServer } from "./server";

interface EnvConfig {
  port: number;
  apiKey: string;
  xrplNodeUrl: string;
  xrplIssuerSeed: string;
  pinataJwt: string;
  databaseUrl: string;
  logLevel: string;
}

function readEnv(): EnvConfig {
  const required = [
    "SERVER_API_KEY",
    "XRPL_NODE_URL",
    "XRPL_ISSUER_SEED",
    "PINATA_JWT",
    "DATABASE_URL",
  ] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `See .env.example for the full list.`,
    );
  }
  const portRaw = process.env["PORT"] ?? "3000";
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${portRaw}"`);
  }
  return {
    port,
    apiKey: process.env["SERVER_API_KEY"]!,
    xrplNodeUrl: process.env["XRPL_NODE_URL"]!,
    xrplIssuerSeed: process.env["XRPL_ISSUER_SEED"]!,
    pinataJwt: process.env["PINATA_JWT"]!,
    databaseUrl: process.env["DATABASE_URL"]!,
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}

async function main(): Promise<void> {
  const env = readEnv();

  const isProduction = process.env["NODE_ENV"] === "production";
  const logger = pino({
    level: env.logLevel,
    redact: [
      "req.headers.authorization",
      "req.headers['x-api-key']",
      "req.headers.cookie",
    ],
    ...(isProduction
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }),
  });

  const sdk = new XRPLGamingSDK({
    xrpl: {
      nodeUrl: env.xrplNodeUrl,
      issuerWallet: { seed: env.xrplIssuerSeed },
    },
    db: new PostgresAdapter({ connectionString: env.databaseUrl }),
    ipfs: new PinataAdapter({ jwt: env.pinataJwt }),
  });

  await sdk.init();
  logger.info("XRPL Gaming SDK initialized");

  const app = createServer({ sdk, apiKey: env.apiKey, logger });

  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, "xrpl-gaming-server listening");
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "shutting down");
    // Stop accepting new requests and wait for in-flight ones to drain
    // before closing the SDK / XRPL client. Hard-cap the wait at 10s so
    // a stuck connection can't block forever.
    await Promise.race([
      new Promise<void>((resolve) => {
        server.close((err) => {
          if (err) logger.error({ err }, "error closing http server");
          resolve();
        });
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
    ]);
    try {
      await sdk.close();
    } catch (err) {
      logger.error({ err }, "error closing SDK");
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start xrpl-gaming-server:", err);
  process.exit(1);
});
