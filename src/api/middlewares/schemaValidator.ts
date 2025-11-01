import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

import logger from "../../configs/logger";

export const validate = (
  body: ZodSchema | null,
  query: ZodSchema | null,
  params: ZodSchema | null
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.info("Validating schema");

      if (body) {
        req.body = body.parse(req.body);
      }

      if (query) {
        const parsed = query.parse(req.query);
        req.query = parsed as typeof req.query;
      }

      if (params) {
        const parsed = params.parse(req.params);
        req.params = parsed as typeof req.params;
      }

      logger.info("Schema validated successfully");

      next();
    } catch (err) {
      logger.warn("Validation failed", err);
      next(err);
    }
  };
};
