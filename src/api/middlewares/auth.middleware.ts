import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../../configs/envConfig";
import { CustomError } from "../../utils/custom-error";
import { isAccessTokenBlacklisted } from "../../utils/redisToken";
import logger from "../../configs/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    jti: string;
  };
}

export const authenticate =
  (requiredRoles?: string[]) =>
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const jwt_token = authHeader?.split(" ")[1];

      if (
        authHeader === null ||
        authHeader === "" ||
        authHeader === undefined ||
        jwt_token === null ||
        jwt_token === "" ||
        jwt_token === undefined
      ) {
        logger.warn("Authentication failed: Missing or invalid token format");

        throw new CustomError(
          "Missing or invalid Authorization header",
          401,
          "AUTH_HEADER_MISSING"
        );
      }

      const token = authHeader.split(" ")[1];

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "TokenExpiredError") {
          throw new CustomError("Access token expired", 401, "TOKEN_EXPIRED");
        }
        throw new CustomError("Invalid access token", 401, "TOKEN_INVALID");
      }

      const { jti, userId, role } = decoded;
      if (
        jti === null ||
        jti === undefined ||
        jti === "" ||
        userId === null ||
        userId === undefined ||
        userId === "" ||
        role === null ||
        role === undefined ||
        role === ""
      ) {
        throw new CustomError(
          "Malformed access token payload",
          401,
          "TOKEN_MALFORMED"
        );
      }

      const isBlacklisted = await isAccessTokenBlacklisted(jti);
      if (isBlacklisted) {
        throw new CustomError(
          "Access token has been revoked",
          401,
          "TOKEN_BLACKLISTED"
        );
      }

      req.user = { userId, role, jti };

      if (
        requiredRoles &&
        requiredRoles.length > 0 &&
        !requiredRoles.includes(role)
      ) {
        throw new CustomError(
          "Access denied: insufficient permissions",
          403,
          "FORBIDDEN_ROLE"
        );
      }

      logger.info(
        `Authenticated request from user ${userId} with role ${role}`
      );
      next();
    } catch (error) {
      if (error instanceof CustomError) {
        logger.warn(`[AUTH] ${error.code ?? "AUTH_ERROR"} - ${error.message}`);
        return next(error);
      }

      logger.error("[AUTH] Unexpected error during authentication", error);
      return next(
        new CustomError("Internal authentication error", 500, "AUTH_INTERNAL")
      );
    }
  };
