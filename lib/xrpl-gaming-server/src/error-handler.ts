import type { ErrorRequestHandler, Request, Response } from "express";
import { ZodError } from "zod";
import {
  ManagedNotAvailableError,
  XrplGamingError,
  XrplTransactionError,
} from "xrpl-gaming-core";

interface ErrorJson {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Maps SDK / validation errors to a consistent JSON shape and HTTP status.
 * Defined as a 4-arg express error handler — the unused `_next` parameter is
 * required for express to recognize this as the error pipeline.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const payload = errorToPayload(err);
  const log = (req as Request & { log?: { error: (...args: unknown[]) => void } }).log;
  if (log) log.error({ err }, payload.body.error.message);
  res.status(payload.status).json(payload.body);
};

interface MappedError {
  status: number;
  body: ErrorJson;
}

function errorToPayload(err: unknown): MappedError {
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request did not match the expected schema",
          details: err.issues,
        },
      },
    };
  }
  if (err instanceof ManagedNotAvailableError) {
    return {
      status: 501,
      body: {
        error: {
          code: "MANAGED_NOT_AVAILABLE",
          message: err.message,
        },
      },
    };
  }
  if (err instanceof XrplTransactionError) {
    return {
      status: 502,
      body: {
        error: {
          code: "XRPL_TX_FAILED",
          message: err.message,
        },
      },
    };
  }
  if (err instanceof XrplGamingError) {
    return {
      status: 400,
      body: {
        error: {
          code: "SDK_ERROR",
          message: err.message,
        },
      },
    };
  }
  const message =
    err instanceof Error ? err.message : "Unexpected server error";
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
  };
}

/** 404 fallback for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
}
