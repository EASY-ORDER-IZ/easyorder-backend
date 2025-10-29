import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { registerAuthDocs } from "./auth";
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

registerAuthDocs(registry);
