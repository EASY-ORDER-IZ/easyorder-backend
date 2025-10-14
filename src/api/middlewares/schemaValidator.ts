import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import logger from "../../configs/logger";

export const validateSchama =
  (body: ZodSchema | null, query: ZodSchema | null, params: ZodSchema | null) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.info("Validating schema");
      if (body !== null) {
        body.parse(req.body);
      }
      if (query !== null) {
        query.parse(req.query);
      }
      if (params !== null) {
        params.parse(req.params);
      }
      logger.info("Schema validated successfully");
      next();
    } catch (err: unknown) {
      logger.warn("Validation failed", err);
      res.status(400).json({
        success: false,
        message: "Invalid request data",
        error: err,
      });
    }
  };
