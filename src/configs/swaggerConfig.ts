import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { env } from "./envConfig";

export const setupSwagger = (app: Express): void => {
  const isDevOrTest = ["dev", "test"].includes(env.node_env);

  if (!isDevOrTest) {
    return;
  }

  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "First Chance API",
        version: "1.0.0",
        description: "API documentation for the First Chance backend system",
      },
      servers: [
        {
          url:
            env.node_env === "dev"
              ? `http://localhost:${env.PORT}`
              : `https://api.FirstChance.com`,
          description: env.node_env,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["src/api/v1/routes/**/*.ts"],
  };

  const swaggerSpec = swaggerJsdoc(options);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
