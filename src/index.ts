import { AppDataSource } from "./configs/database";
import logger from "./configs/logger";

export const initializeApp = async () => {
  try {
    
    await AppDataSource.initialize();
    logger.info("Database connected successfully!");
  } catch (err) {
    
    logger.error("Database initialization failed:", err);
    process.exit(1);
  }
};
