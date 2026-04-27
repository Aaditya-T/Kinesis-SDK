import { type Express } from "express";
import type { Logger } from "pino";
import type { XRPLGamingSDK } from "@workspace/xrpl-gaming-core";
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
     * Optional pino logger. Defaults to a sane stdout logger when omitted.
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
export declare function createServer(config: ServerConfig): Express;
//# sourceMappingURL=server.d.ts.map