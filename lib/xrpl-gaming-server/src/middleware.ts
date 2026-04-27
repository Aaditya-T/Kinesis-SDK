import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Validates an `x-api-key` header against the configured server API key. Uses
 * Node's `crypto.timingSafeEqual` over fixed-length buffers to defeat timing
 * oracles. Length-mismatched keys still take a constant-time compare against
 * the expected key (vs an early-return), so an attacker cannot infer expected
 * key length from response timing. This is a minimal auth surface;
 * multi-tenant / OAuth is intentionally out of scope.
 */
export function apiKeyAuth(expectedKey: string): RequestHandler {
  if (!expectedKey || expectedKey.length < 16) {
    throw new Error(
      "apiKeyAuth: server API key must be set and at least 16 characters",
    );
  }
  const expected = Buffer.from(expectedKey, "utf8");

  return (req: Request, res: Response, next: NextFunction): void => {
    const provided = req.header("x-api-key") ?? "";
    if (!constantTimeEquals(provided, expected)) {
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

function constantTimeEquals(provided: string, expected: Buffer): boolean {
  // Always compare against `expected.length` bytes so wrong-length inputs
  // take the same compare path. Pad/truncate the provided value into a fresh
  // buffer of the right size; the `lengthMatches` flag still gates success.
  const providedBuf = Buffer.from(provided, "utf8");
  const lengthMatches = providedBuf.length === expected.length;
  const candidate = Buffer.alloc(expected.length);
  providedBuf.copy(candidate, 0, 0, Math.min(providedBuf.length, expected.length));
  const equal = timingSafeEqual(candidate, expected);
  return lengthMatches && equal;
}
