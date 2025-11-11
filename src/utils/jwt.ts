import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { Role } from "../constants";
import { env } from "../configs/envConfig";
import { CustomError } from "./custom-error";
import { getRefreshToken } from "./redisToken";

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

  async verifyRefreshToken(
    token: string
  ): Promise<{ userId: string; role: Role; jti: string }> {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
        userId: string;
        role: Role;
        jti: string;
        exp: number;
      };

      if (!decoded?.jti) {
        throw new CustomError("Invalid refresh token", 401, "INVALID_TOKEN");
      }

      const storedUserId = await getRefreshToken(decoded.jti);
      if (storedUserId === null) {
        throw new CustomError(
          "Refresh token expired or invalid",
          401,
          "INVALID_TOKEN"
        );
      }

      if (storedUserId !== decoded.userId) {
        throw new CustomError("Invalid refresh token", 401, "INVALID_TOKEN");
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
        jti: decoded.jti,
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
