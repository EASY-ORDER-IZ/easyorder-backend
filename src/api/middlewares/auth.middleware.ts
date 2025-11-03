import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../configs/envConfig";
import { CustomError } from "../../utils/custom-error";
import { isAccessTokenBlacklisted } from "../../utils/redisToken";
import logger from "../../configs/logger";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: string;
      storeId?: string;
      jti: string;
    };
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.debug("check headers for token");
  const authHeader = req.headers.authorization;
  const jwt_token = authHeader?.split(" ")[1];

  if (jwt_token === null || jwt_token === "" || jwt_token === undefined) {
    logger.warn("[AUTH] Missing Authorization header or token");
    return next(
      new CustomError(
        "Authorization header missing",
        401,
        "AUTH_HEADER_MISSING"
      )
    );
  }

  try {
    const payload = jwt.verify(jwt_token, env.JWT_SECRET) as {
      jti: string;
      userId: string;
      role: string;
      storeId?: string;
    };
    logger.debug("token verified");

    const isBlacklisted = await isAccessTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      logger.warn(`[AUTH] Token with jti ${payload.jti} is blacklisted`);
      throw new CustomError(
        "Access token has been revoked",
        401,
        "TOKEN_BLACKLISTED"
      );
    }

    req.user = { userId: payload.userId, role: payload.role, jti: payload.jti, storeId: payload.storeId };
    logger.info(
      `Authenticated request from user ${payload.userId} with role ${payload.role}`
    );

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      logger.warn(`[AUTH] ${error.code ?? "AUTH_ERROR"} - ${error.message}`);
      return next(error);
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expired", 401, "TOKEN_EXPIRED"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Invalid token", 401, "INVALID_TOKEN"));
    }

    logger.error("[AUTH] Unexpected error during authentication", error);
    next(new CustomError("Unauthorized", 401, "AUTH_ERROR"));
  }
};
