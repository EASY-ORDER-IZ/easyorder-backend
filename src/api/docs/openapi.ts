import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { AuthDocs } from "./auth";
import { ProductDocs } from "./products";
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

AuthDocs(registry);
ProductDocs(registry);
