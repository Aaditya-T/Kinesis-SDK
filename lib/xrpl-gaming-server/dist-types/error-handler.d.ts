import type { ErrorRequestHandler, Request, Response } from "express";
/**
 * Maps SDK / validation errors to a consistent JSON shape and HTTP status.
 * Defined as a 4-arg express error handler — the unused `_next` parameter is
 * required for express to recognize this as the error pipeline.
 */
export declare const errorHandler: ErrorRequestHandler;
/** 404 fallback for unmatched routes. */
export declare function notFoundHandler(_req: Request, res: Response): void;
//# sourceMappingURL=error-handler.d.ts.map