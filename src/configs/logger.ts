import winston from "winston";
import path from "path";
import fs from "fs";
import { env } from "process";

const { combine, timestamp, printf, colorize, json } = winston.format;

const node_env = env.NODE_ENV ?? "dev";

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const consoleTransport = new winston.transports.Console({
  format:
    node_env === "dev"
      ? combine(colorize(), timestamp(), logFormat)
      : combine(timestamp(), json()),
});

const logger = winston.createLogger({
  level: node_env === "test" ? "error" : node_env == "dev" ? "debug" : "info",
  transports: [consoleTransport],
});

if (node_env === "prod") {
  const logDir = path.join(process.cwd(), "logs");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
    })
  );
}

export default logger;
