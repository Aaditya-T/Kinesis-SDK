import express, { type Express } from "express";
import pinoHttp from "pino-http";
import type { Logger } from "pino";
import type { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
import { apiKeyAuth } from "./middleware";
import { errorHandler, notFoundHandler } from "./error-handler";
import { healthRouter } from "./routes/health";
import { nftRouter } from "./routes/nft";

export interface ServerConfig {
  /**
   * A fully-constructed (and ideally already-`init()`-ed) `XRPLGamingSDK`.
   * The CLI handles construction + init from env vars; programmatic callers
   * may bring their own.
   */
  sdk: XRPLGamingSDK;
  /**
   * Shared secret required in the `x-api-key` header on every request
   * (except `GET /health`). Must be at least 16 characters.
   */
  apiKey: string;
  /**
   * Optional pino logger. Defaults to a sane stdout logger when omitted.
   */
  logger?: Logger;
  /**
   * Optional max JSON body size. Defaults to "1mb".
   */
  jsonLimit?: string;
}

/**
 * Build a fully-wired express app. Health check is unauthenticated; all
 * other routes require the `x-api-key` header to match `config.apiKey`.
 */
export function createServer(config: ServerConfig): Express {
  const app = express();

  if (config.logger) {
    app.use(pinoHttp({ logger: config.logger }));
  }
  app.use(express.json({ limit: config.jsonLimit ?? "1mb" }));

  // Health is unauthenticated so load balancers / orchestrators can probe it.
  app.use(healthRouter());

  // All NFT routes require the API key.
  app.use(apiKeyAuth(config.apiKey));
  app.use(nftRouter(config.sdk));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
