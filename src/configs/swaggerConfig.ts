import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";

import { registry } from "../api/docs/openapi";
import { env } from "./envConfig";

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "First Chance APIs",
    description: "API endpoints for First Chance application",
    version: "1.0.0",
  },
  servers:
    env.node_env === "dev"
      ? [
          {
            url: "http://localhost:3000",
            description: "development server",
          },
        ]
      : [
          {
            url: "http://localhost:8000",
            description: "production server",
          },
        ],
});

export const swaggerDocs = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(openApiDocument),
};
