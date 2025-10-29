import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { notFoundHandler } from "./api/middlewares/notFoundHandler";
import { errorHandler } from "./api/middlewares/errorHandler";
import logger from "./configs/logger";
import v1Routes from "./api/v1/routes";
import { swaggerDocs } from "./configs/swaggerConfig";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api-docs", swaggerDocs.serve, swaggerDocs.setup);

app.get("/health", (req, res) => {
  logger.info("Health check endpoint called");
  logger.debug("Debugging info: Health check endpoint accessed");
  logger.error("This is a test error log");
  logger.warn("This is a test warning log");

  res.send("Server is healthy");
});

app.use("/api/v1", v1Routes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
