import redisClient from "./redisClient";
import { REDIS_KEY_PREFIXES } from "../constants/redis";

const refresh_token_prefix = REDIS_KEY_PREFIXES.REFRESH_TOKEN;
const blacklist_prefix = REDIS_KEY_PREFIXES.BLACKLIST;

const buildKey = (prefix: string, jti: string): string => `${prefix}_${jti}`;

export async function storeRefreshToken(
  jti: string,
  userId: string,
  ttlSeconds: number
): Promise<void> {
  const key = buildKey(refresh_token_prefix, jti);

  await redisClient.set(key, userId, "EX", ttlSeconds);
}

export async function getRefreshToken(jti: string): Promise<string | null> {
  const key = buildKey(refresh_token_prefix, jti);
  return redisClient.get(key);
}

export async function deleteRefreshToken(jti: string): Promise<void> {
  const key = buildKey(refresh_token_prefix, jti);
  await redisClient.del(key);
}

export async function blacklistAccessToken(
  jti: string,
  ttlSeconds: number
): Promise<void> {
  const key = buildKey(blacklist_prefix, jti);

  await redisClient.set(key, "1", "EX", ttlSeconds);
}

export async function isAccessTokenBlacklisted(jti: string): Promise<boolean> {
  const key = buildKey(blacklist_prefix, jti);

  const exists = await redisClient.exists(key);
  return exists === 1;
}
