import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { Role } from "../constants";
import { env } from "../configs/envConfig";

const ACCESS_TOKEN_SECRET = env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL_SECONDS;
const REFRESH_TOKEN_TTL_SECONDS = env.REFRESH_TOKEN_TTL_SECONDS;

export class TokenGenerator {
  generateAuthTokens(
    userId: string,
    role: Role
  ): {
    accessToken: string;
    refreshToken: string;
    refreshJti: string;
    refreshTtlSeconds: number;
  } {
    const refreshJti = uuidv4();

    const accessToken = jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = jwt.sign(
      { userId, role, jti: refreshJti },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL_SECONDS }
    );

    return {
      accessToken,
      refreshToken,
      refreshJti,
      refreshTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
    };
  }
}
