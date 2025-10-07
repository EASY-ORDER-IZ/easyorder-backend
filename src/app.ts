import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { notFoundHandler } from "./api/middlewares/notFoundHandler";

import logger from "./configs/logger";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
// ? app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  logger.info("Health check endpoint called");
  logger.debug("Debugging info: Health check endpoint accessed");
  logger.error("This is a test error log");
  logger.warn("This is a test warning log");

  res.send("Server is healthy");
});

app.use(notFoundHandler);

export default app;
