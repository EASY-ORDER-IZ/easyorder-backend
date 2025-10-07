import { env } from "./configs/envConfig";
import app from "./app";
import logger from "./configs/logger";
import { initializeApp } from ".";


const startServer = async () : Promise<void> => {
  await initializeApp();
  const PORT = env.PORT || 3000;

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
