import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Validates an `x-api-key` header against the configured server API key. We
 * use a constant-time-ish compare to avoid trivial timing oracles. This is a
 * minimal auth surface; multi-tenant / OAuth is intentionally out of scope.
 */
export function apiKeyAuth(expectedKey: string): RequestHandler {
  if (!expectedKey || expectedKey.length < 16) {
    throw new Error(
      "apiKeyAuth: server API key must be set and at least 16 characters",
    );
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const provided = req.header("x-api-key");
    if (!provided || !timingSafeEqualString(provided, expectedKey)) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-api-key header",
        },
      });
      return;
    }
    next();
  };
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
