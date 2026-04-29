import express, { type Express } from "express";
import pinoHttp from "pino-http";
import type { Logger } from "pino";
import type { XRPLGamingSDK } from "xrpl-gaming-core";
import { apiKeyAuth } from "./middleware.js";
import { errorHandler, notFoundHandler } from "./error-handler.js";
import { healthRouter } from "./routes/health.js";
import { nftRouter } from "./routes/nft.js";

export interface ServerConfig {
  /**
   * A fully-constructed (and ideally already-`init()`-ed) `XRPLGamingSDK`.
   * The CLI handles construction + init from env vars; programmatic callers
   * may bring their own.
   */
  sdk: XRPLGamingSDK;
  /**
   * Shared secret required in the `x-api-key` header on every request,
   * including `GET /health`. Must be at least 16 characters.
   */
  apiKey: string;
  /**
   * Optional pino logger. When provided, request logging via `pino-http` is
   * mounted on every request. When omitted, no HTTP request logging is set
   * up (the CLI always provides one; programmatic embedders may opt in).
   */
  logger?: Logger;
  /**
   * Optional max JSON body size. Defaults to "1mb".
   */
  jsonLimit?: string;
}

/**
 * Build a fully-wired express app. Every route — including `/health` —
 * requires the `x-api-key` header to match `config.apiKey`.
 */
export function createServer(config: ServerConfig): Express {
  const app = express();

  if (config.logger) {
    app.use(pinoHttp({ logger: config.logger }));
  }
  app.use(express.json({ limit: config.jsonLimit ?? "1mb" }));

  // Per the spec, every endpoint — including /health — requires the
  // x-api-key header. Operators who need an unauthenticated probe should
  // run a sidecar /healthz behind their reverse proxy.
  app.use(apiKeyAuth(config.apiKey));
  app.use(healthRouter());
  app.use(nftRouter(config.sdk));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
