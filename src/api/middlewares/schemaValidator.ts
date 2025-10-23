import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import logger from "../../configs/logger";

export interface ValidatedRequest extends Request {
  validatedBody?: unknown;
  validatedQuery?: unknown;
  validatedParams?: unknown;
}

export const validateSchema =
  <
    Body extends ZodTypeAny | null,
    Query extends ZodTypeAny | null,
    Params extends ZodTypeAny | null,
  >(
    bodySchema: Body,
    querySchema: Query,
    paramsSchema: Params
  ) =>
  (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    try {
      logger.info("Validating schema");

      if (bodySchema) {
        req.validatedBody = bodySchema.parse(req.body);
      }

      if (querySchema) {
        req.validatedQuery = querySchema.parse(req.query);
      }

      if (paramsSchema) {
        req.validatedParams = paramsSchema.parse(req.params);
      }
      logger.info("Schema validated successfully");

      next();
    } catch (err) {
      logger.warn("Validation failed", err);
      res.status(400).json({
        success: false,
        message: "Invalid request data",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      //   next(err);
    }
  };
