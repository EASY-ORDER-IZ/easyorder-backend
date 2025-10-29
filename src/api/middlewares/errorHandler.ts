import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { CustomError } from "../../utils/custom-error";
import logger from "../../configs/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code ?? "ERROR",
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: formattedErrors,
      },
    });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      error: {
        code: "TOKEN_INVALID",
        message: "Invalid token",
      },
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
      },
    });
    return;
  }

  if (err.name === "QueryFailedError") {
    logger.error("Database query failed:", err);
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "A database error occurred",
      },
    });
    return;
  }

  logger.error("Unexpected error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? err.message
        : "An unexpected error occurred. Please try again later.",
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};
