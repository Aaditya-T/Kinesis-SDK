import { Router, type IRouter } from "express";
import { HealthResponseSchema } from "../schemas";

const startedAt = Date.now();

export function healthRouter(): IRouter {
  const router = Router();

  router.get("/health", (_req, res) => {
    const body = HealthResponseSchema.parse({
      status: "ok",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    });
    res.json(body);
  });

  return router;
}
