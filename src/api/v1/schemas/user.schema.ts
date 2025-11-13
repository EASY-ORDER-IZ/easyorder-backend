import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createStoreSchema = z
  .object({
    storeName: z
      .string()
      .min(3, "Store name must be at least 3 characters")
      .max(255, "Store name must not exceed 255 characters")
      .openapi({
        example: "My Awesome Store",
        description: "Unique store name",
      }),
  })
  .openapi("CreateStoreRequest");

export type CreateStoreRequest = z.infer<typeof createStoreSchema>;
