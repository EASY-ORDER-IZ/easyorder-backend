import { z } from "zod";
import { ProductSize } from "../../../constants";

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

export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema>;
