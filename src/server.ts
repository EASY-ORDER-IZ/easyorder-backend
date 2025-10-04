import { env } from "./configs/envConfig";
import app from "./app";
import logger from "./configs/logger";
// ? import { initializeApp } from "./index";

const startServer = async () => {
  // ? await initializeApp();
  const PORT = env.PORT || 3000;

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();
