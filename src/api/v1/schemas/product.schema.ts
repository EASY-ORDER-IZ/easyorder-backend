import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ProductSize } from "../../../constants";
import { paginationSchema } from "./pagination.schema";

extendZodWithOpenApi(z);

const productImageSchema = z.object({
  imageName: z
    .string()
    .min(1, "Image name is required")
    .max(255, "Image name must not exceed 255 characters")
    .regex(
      /\.(jpg|jpeg|png)$/i,
      "Image name must end with .jpg, .jpeg, or .png"
    )
    .openapi({
      example: "tshirt-front.jpg",
      description: "Image file name (must be .jpg, .jpeg, or .png)",
    }),

  isPrimary: z.boolean().default(false).openapi({
    example: true,
    description: "Whether this is the primary product image",
  }),
});

export const createProductSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(255, "Product name must not exceed 255 characters")
      .openapi({
        example: "Classic T-Shirt",
        description: "Product name",
      }),

    description: z
      .string()
      .max(5000, "Description must not exceed 5000 characters")
      .optional()
      .openapi({
        example: "Comfortable 100% cotton t-shirt perfect for everyday wear",
        description: "Product description",
      }),

    price: z
      .number()
      .positive("Price must be greater than 0")
      .max(99999999.99, "Price must not exceed 99999999.99")
      .openapi({
        example: 29.99,
        description: "Product price in dollars",
      }),

    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .openapi({
        example: 100,
        description: "Available stock quantity",
      }),

    size: z
      .enum([
        ProductSize.XSMALL,
        ProductSize.SMALL,
        ProductSize.MEDIUM,
        ProductSize.LARGE,
        ProductSize.XLARGE,
      ])
      .optional()
      .openapi({
        example: ProductSize.MEDIUM,
        description: "Product size (optional)",
      }),

    images: z
      .array(productImageSchema)
      .min(1, "At least one image is required")
      .max(10, "Maximum 10 images allowed")
      .openapi({
        description: "Array of product images",
      }),
  })
  .refine(
    (data) => {
      if (data.images.length === 1) {
        return data.images[0].isPrimary === true;
      }

      const primaryCount = data.images.filter((img) => img.isPrimary).length;
      return primaryCount === 1;
    },
    {
      message:
        "If one image: it must be primary. If multiple images: exactly one must be primary",
      path: ["images"],
    }
  )
  .openapi("CreateProductRequest");

export const getProductByIdSchema = z
  .object({
    productId: z.string().uuid("Product ID must be a valid UUID").openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "Product UUID",
    }),
  })
  .openapi("GetProductByIdParams");

export const filterProductsSchema = z
  .object({
    name: z
      .string()
      .max(255, "Name filter must not exceed 255 characters")
      .optional()
      .openapi({
        example: "T-Shirt",
        description: "Filter products by name ",
      }),

    size: z
      .union([
        z.array(
          z.enum([
            ProductSize.XSMALL,
            ProductSize.SMALL,
            ProductSize.MEDIUM,
            ProductSize.LARGE,
            ProductSize.XLARGE,
          ])
        ),
        z.enum([
          ProductSize.XSMALL,
          ProductSize.SMALL,
          ProductSize.MEDIUM,
          ProductSize.LARGE,
          ProductSize.XLARGE,
        ]),
      ])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .optional()

      .openapi({
        example: [ProductSize.SMALL, ProductSize.MEDIUM],
        description: "Filter by one or more sizes (optional)",
      }),

    price: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Price must be a positive number",
      })
      .optional(),

    minPrice: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Price must be a positive number",
      })
      .optional(),

    maxPrice: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Price must be a positive number",
      })
      .optional(),

    sortBy: z
      .enum(["name", "price", "stock", "createdAt"])
      .default("price")
      .optional(),

    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  })
  .strict()
  .openapi("GetAllProductsQuery");

export const filterProductAndPaginationSchema = filterProductsSchema
  .merge(paginationSchema)
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.price !== null &&
      data.price !== undefined &&
      ((data.minPrice !== null && data.minPrice !== undefined) ||
        (data.maxPrice !== null && data.maxPrice !== undefined))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either price OR minPrice/maxPrice, not both.",
        path: ["price"],
      });
    }

    if (
      data.minPrice !== null &&
      data.minPrice !== undefined &&
      data.maxPrice !== null &&
      data.maxPrice !== undefined
    ) {
      if (data.minPrice > data.maxPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "maxPrice must be more than the minPrice",
          path: ["maxPrice"],
        });
      }
    }
  })
  .openapi("FilterProductsWithPagination");

export const updateProductSchema = createProductSchema
  .partial()
  .openapi("UpdateProductRequest");

export const productIdParamSchema = z
  .object({
    productId: z.string().uuid("Product ID must be a valid UUID").openapi({
      example: "a3f1c9e2-8b4d-4c3e-9f1e-2d3c4b5a6e7f",
      description: "Unique identifier for the product",
    }),
  })
  .openapi("ProductIdParam");

export type FilterProductsWithPagination = z.infer<
  typeof filterProductAndPaginationSchema
>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema>;
