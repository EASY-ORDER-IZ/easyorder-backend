import { env } from "./configs/envConfig";
import app from "./app";
import logger from "./configs/logger";
import { initializeApp } from ".";
import { initRedis, shutdownRedis } from "./utils/redisClient";

const startServer = async (): Promise<void> => {
  await initRedis();

  await initializeApp();
  const PORT = env.PORT || 3000;

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

process.on("SIGINT", () => {
  void (async (): Promise<void> => {
    logger.info("SIGINT received, shutting down...");
    await shutdownRedis();
    process.exit(0);
  })();
});

process.on("SIGTERM", () => {
  void (async (): Promise<void> => {
    logger.info("SIGTERM received, shutting down...");
    await shutdownRedis();
    process.exit(0);
  })();
});

startServer().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
