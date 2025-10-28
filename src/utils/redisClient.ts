import Redis from "ioredis";
import logger from "../configs/logger"; // adapt to your logger
import { env } from "../configs/envConfig";

const client = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  tls: env.REDIS_TLS === "true" ? {} : undefined,
  lazyConnect: true,
  enableReadyCheck: true,
  connectionName: `backend-${process.pid}`,
  retryStrategy(times): number {
    const delay = Math.min(
      50 * Math.pow(2, times),
      env.REDIS_MAX_RETRY_DELAY_MS
    );
    logger.warn(`Redis retry attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
  reconnectOnError(err): boolean {
    logger.error("Redis reconnectOnError:", err?.message ?? err);
    return true;
  },
});

client.on("connect", () => logger.info("Redis client connecting..."));
client.on("ready", () => logger.info("Redis client ready"));
client.on("error", (err) => logger.error("Redis error", err));
client.on("close", () => logger.warn("Redis connection closed"));
client.on("end", () => logger.warn("Redis connection ended"));
client.on("reconnecting", (delay: number) =>
  logger.warn(`Redis reconnecting in ${delay}ms`)
);

export async function initRedis(): Promise<void> {
  try {
    await client.connect();
    logger.info("Connected to Redis");
  } catch (err) {
    logger.error("Failed to connect to Redis at startup", err);
  }
}

export async function shutdownRedis(): Promise<void> {
  try {
    await client.quit();
    logger.info("Redis client quit gracefully");
  } catch (err) {
    logger.warn("Error shutting down Redis client", err);
    client.disconnect();
  }
}

export default client;
