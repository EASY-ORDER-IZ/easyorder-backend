import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { Role } from "../constants";
import { env } from "../configs/envConfig";
import { CustomError } from "./custom-error";
import { getRefreshToken, isAccessTokenValid } from "./redisToken";

const ACCESS_TOKEN_SECRET = env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL_SECONDS;
const REFRESH_TOKEN_TTL_SECONDS = env.REFRESH_TOKEN_TTL_SECONDS;

export class JwtUtil {
  generateAuthTokens(
    userId: string,
    role: Role
  ): {
    accessToken: string;
    refreshToken: string;
    refreshJti: string;
    accessJti: string;
    refreshTtlSeconds: number;
    accessTtlSeconds: number;
  } {
    const refreshJti = uuidv4();
    const accessJti = uuidv4();

    const accessToken = jwt.sign(
      { jti: accessJti, userId, role, refreshJti },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = jwt.sign(
      { userId, role, jti: refreshJti },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL_SECONDS }
    );

    return {
      accessToken,
      refreshToken,
      refreshJti,
      accessJti,
      refreshTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
      accessTtlSeconds: ACCESS_TOKEN_TTL,
    };
  }

  async verifyJwtToken(
    token: string,
    type: "access" | "refresh"
  ): Promise<{ userId: string; role: Role; jti: string; exp: number }> {
    try {
      const secret =
        type === "access" ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;

      const decoded = jwt.verify(token, secret) as
        | {
            userId: string;
            role: Role;
            jti: string;
            exp: number;
          }
        | undefined;

      if (!decoded?.userId || !decoded?.role || !decoded?.jti) {
        throw new CustomError("Invalid token payload", 401, "INVALID_TOKEN");
      }

      if (type === "refresh") {
        const storedUserId = await getRefreshToken(decoded.jti);
        if (!storedUserId || storedUserId !== decoded.userId) {
          throw new CustomError(
            "Invalid or expired refresh token",
            401,
            "INVALID_TOKEN"
          );
        }
      }

      if (type === "access") {
        const valid = await isAccessTokenValid(decoded.jti);
        if (!valid) {
          throw new CustomError(
            "Access token revoked or expired",
            401,
            "TOKEN_BLACKLISTED"
          );
        }
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
        jti: decoded.jti,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError("Refresh token expired", 401, "INVALID_TOKEN");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError("Invalid refresh token", 401, "INVALID_TOKEN");
      }
      throw error;
    }
  }
}
