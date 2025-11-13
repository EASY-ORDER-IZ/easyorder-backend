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
  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_TTL_SECONDS: Number(required("ACCESS_TOKEN_TTL_SECONDS")),
  REFRESH_TOKEN_TTL_SECONDS: Number(required("REFRESH_TOKEN_TTL_SECONDS")),
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS ?? "5"),
  OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES ?? "15"),
  REDIS_HOST: required("REDIS_HOST"),
  REDIS_PORT: Number(required("REDIS_PORT")),
  REDIS_TLS: required("REDIS_TLS"),
  REDIS_MAX_RETRY_DELAY_MS: Number(required("REDIS_MAX_RETRY_DELAY_MS")),

  AWS_REGION: required("AWS_REGION"),
  AWS_S3_BUCKET_NAME: required("AWS_S3_BUCKET_NAME"),
  AWS_ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"),
};
