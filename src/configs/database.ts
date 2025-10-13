import { DataSource } from "typeorm";

import { env } from "./envConfig";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { Store } from "../entities/Store";
import { OtpCode } from "../entities/OtpCode";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST || "localhost",
  port: Number(env.DB_PORT) || 5432,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  synchronize: false,
  entities: [User, UserRole, Store, OtpCode],
  migrations: ["src/database/migrations/*.ts"],
});
