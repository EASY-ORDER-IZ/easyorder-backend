import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const paginationSchema = z
  .object({
    page: z
      .string()
      .transform((val) => (val.trim() === "" ? undefined : val))
      .optional()
      .default("1")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "must be a positive number",
      })
      .openapi({
        example: "1",
        description: "Page number for pagination (optional)",
      }),

    limit: z
      .string()
      .transform((val) => (val.trim() === "" ? undefined : val))
      .optional()
      .default("10")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "must be a positive number",
      })
      .openapi({
        example: "10",
        description: "Number of items per page for pagination (optional)",
      }),
  })
  .openapi("paginationSchema");
