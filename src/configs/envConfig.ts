import dotenv from "dotenv";
import path from "path";

import logger from "./logger";
const node_env = process.env.NODE_ENV ?? "dev";

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${node_env}`),
});

const required = (key: string): string => {
  if (!(key in process.env)) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const value = process.env[key];
  if (value === undefined || value === null || value === "") {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  node_env,
  PORT: required("PORT"),
  DB_HOST: required("DB_HOST"),
  DB_PORT: Number(required("DB_PORT")),
  POSTGRES_USER: required("POSTGRES_USER"),
  POSTGRES_PASSWORD: required("POSTGRES_PASSWORD"),
  POSTGRES_DB: required("POSTGRES_DB"),
  DATABASE_URL: required("DATABASE_URL"),
  DB_USERNAME: required("DB_USERNAME"),
  JWT_SECRET: required("JWT_SECRET"),
};
