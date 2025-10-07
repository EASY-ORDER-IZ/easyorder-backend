import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Tenant } from "../entities/Tenant";
import { UserRole } from "../entities/UserRole";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.prod"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.dev";

dotenv.config({ path: envFile });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: checkEnvVariables("POSTGRES_USER"),
  password: checkEnvVariables("POSTGRES_PASSWORD"),
  database: checkEnvVariables("POSTGRES_DB"),
  synchronize: false,
  entities: [User, Tenant, UserRole],
  migrations: ["src/database/migrations/**/*.ts"],
});

function checkEnvVariables(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} is required and cannot be empty.`
    );
  }
  return value;
}
