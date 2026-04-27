import type { RequestHandler } from "express";
/**
 * Validates an `x-api-key` header against the configured server API key. We
 * use a constant-time-ish compare to avoid trivial timing oracles. This is a
 * minimal auth surface; multi-tenant / OAuth is intentionally out of scope.
 */
export declare function apiKeyAuth(expectedKey: string): RequestHandler;
//# sourceMappingURL=middleware.d.ts.map