import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  CategoryLevelOne,
  CategoryLevelThree,
  CategoryLevelTwoKids,
  CategoryLevelTwoMenWomen,
  ProductSize,
} from "../../../constants";
import { paginationSchema } from "./pagination.schema";

extendZodWithOpenApi(z);

const productImageSchema = z.object({
  imageName: z
    .string()
    .min(1, "Image name is required")
    .max(255, "Image name must not exceed 255 characters")
    .regex(/\.(jpg|png)$/i, "Image name must end with .jpg, .png")
    .openapi({
      example: "tshirt-front.jpg",
      description: "Image file name (must be .jpg, .png)",
    }),

  isPrimary: z.boolean().default(false).openapi({
    example: true,
    description: "Whether this is the primary product image",
  }),
});

const categoryPathSchema = z
  .object({
    root: z.enum(["Men", "Women", "Kids"]).openapi({
      example: "Men",
      description: "Root category - must be exactly: Men, Women, or Kids",
    }),

    subCategory: z
      .enum(["Casual", "Formal", "Sports", "Boys", "Girls", "Babies"])
      .openapi({
        example: "Casual",
        description:
          "Sub-category - For Men/Women: Casual, Formal, Sports | For Kids: Boys, Girls, Babies",
      }),

    productType: z.enum(["Shirts", "T-shirts", "Pants", "Shorts"]).openapi({
      example: "T-shirts",
      description:
        "Product type - must be exactly: Shirts, T-shirts, Pants, or Shorts",
    }),
  })
  .superRefine((data, ctx) => {
    const { root, subCategory } = data;

    if (
      (root === "Men" || root === "Women") &&
      !["Casual", "Formal", "Sports"].includes(subCategory)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `For ${root}, subCategory must be: Casual, Formal, or Sports`,
        path: ["subCategory"],
      });
    }

    if (root === "Kids" && !["Boys", "Girls", "Babies"].includes(subCategory)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "For Kids, subCategory must be: Boys, Girls, or Babies",
        path: ["subCategory"],
      });
    }
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

    categories: z
      .array(categoryPathSchema)
      .min(1, "At least one category is required")
      .openapi({
        example: [
          {
            root: "Men",
            subCategory: "Casual",
            productType: "T-shirts",
          },
        ],
        description:
          "Array of category paths - only valid combinations accepted",
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

export const category = z
  .object({
    root: z
      .enum([
        CategoryLevelOne.MEN,
        CategoryLevelOne.WOMEN,
        CategoryLevelOne.KIDS,
      ])
      .openapi({
        example: CategoryLevelOne.MEN,
        description: "Top-level product category",
      }),

    subCategory: z.string().openapi({
      example: CategoryLevelTwoMenWomen.CASUAL,
      description: "Second-level product category",
    }),

    productType: z
      .enum([
        CategoryLevelThree.SHIRTS,
        CategoryLevelThree.T_SHIRTS,
        CategoryLevelThree.PANTS,
        CategoryLevelThree.SHORTS,
      ])
      .openapi({
        example: CategoryLevelThree.T_SHIRTS,
        description: "Third-level product category",
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.root === CategoryLevelOne.MEN ||
      data.root === CategoryLevelOne.WOMEN
    ) {
      if (
        !Object.values(CategoryLevelTwoMenWomen).includes(
          data.subCategory as CategoryLevelTwoMenWomen
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `For ${data.root} category, the second category must be one of: Casual, Formal, Sports`,
          path: ["subCategory"],
        });
      }
    }

    if (data.root === CategoryLevelOne.KIDS) {
      if (
        !Object.values(CategoryLevelTwoKids).includes(
          data.subCategory as CategoryLevelTwoKids
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `For Kids category, the second category must be one of: Boys, Girls, Babies`,
          path: ["subCategory"],
        });
      }
    }
  });

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

    root: z
      .union([
        z.enum([
          CategoryLevelOne.MEN,
          CategoryLevelOne.WOMEN,
          CategoryLevelOne.KIDS,
        ]),
        z.array(
          z.enum([
            CategoryLevelOne.MEN,
            CategoryLevelOne.WOMEN,
            CategoryLevelOne.KIDS,
          ])
        ),
      ])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .optional(),

    subCategory: z
      .union([
        z.enum([
          CategoryLevelTwoMenWomen.CASUAL,
          CategoryLevelTwoMenWomen.FORMAL,
          CategoryLevelTwoMenWomen.SPORTS,
          CategoryLevelTwoKids.BOYS,
          CategoryLevelTwoKids.GIRLS,
          CategoryLevelTwoKids.BABIES,
        ]),
        z.array(
          z.enum([
            CategoryLevelTwoMenWomen.CASUAL,
            CategoryLevelTwoMenWomen.FORMAL,
            CategoryLevelTwoMenWomen.SPORTS,
            CategoryLevelTwoKids.BOYS,
            CategoryLevelTwoKids.GIRLS,
            CategoryLevelTwoKids.BABIES,
          ])
        ),
      ])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .optional(),

    productType: z
      .union([
        z.enum([
          CategoryLevelThree.SHIRTS,
          CategoryLevelThree.T_SHIRTS,
          CategoryLevelThree.PANTS,
          CategoryLevelThree.SHORTS,
        ]),
        z.array(
          z.enum([
            CategoryLevelThree.SHIRTS,
            CategoryLevelThree.T_SHIRTS,
            CategoryLevelThree.PANTS,
            CategoryLevelThree.SHORTS,
          ])
        ),
      ])
      .transform((val) => (Array.isArray(val) ? val : [val]))
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

    const menWomenSubs = Object.values(CategoryLevelTwoMenWomen);
    const kidsSubs = Object.values(CategoryLevelTwoKids);

    const roots = data.root ?? [];
    const subs = data.subCategory ?? [];

    if (
      subs.some((sub) => menWomenSubs.includes(sub as CategoryLevelTwoMenWomen))
    ) {
      const hasMenOrWomen =
        roots.includes(CategoryLevelOne.MEN) ||
        roots.includes(CategoryLevelOne.WOMEN);
      if (!hasMenOrWomen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Subcategories '${menWomenSubs.join(
            ", "
          )}' require root category 'MEN' or 'WOMEN'.`,
          path: ["root"],
        });
      }
    }

    if (subs.some((sub) => kidsSubs.includes(sub as CategoryLevelTwoKids))) {
      const hasKids = roots.includes(CategoryLevelOne.KIDS);
      if (!hasKids) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Subcategories '${kidsSubs.join(
            ", "
          )}' require root category 'KIDS'.`,
          path: ["root"],
        });
      }
    }

    if (data.productType?.length && !subs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "You cannot specify productType without specifying a subCategory.",
        path: ["subCategory"],
      });
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

export const productImageResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: "1e9b4a3b-7b0d-45c0-bf57-8d3a89d41d33",
      description: "Unique identifier of the product image",
    }),
    imageName: z.string().openapi({
      example: "tshirt_front.jpg",
      description: "Name or filename of the image",
    }),
    isPrimary: z.boolean().openapi({
      example: true,
      description: "Indicates if this is the primary image of the product",
    }),
    createdAt: z.string().datetime().openapi({
      example: "2025-11-09T11:23:45.000Z",
      description: "When the image was created",
    }),
  })
  .openapi("ProductImageResponse");

export const productCategorySchema = z
  .object({
    id: z.string().uuid().openapi({
      example: "2a4c2b9b-1bcd-42c7-9f33-7de8e3195e4b",
      description: "Unique identifier of the category link",
    }),
    category: z
      .object({
        id: z.string().uuid().openapi({
          example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
          description: "Unique identifier of the category",
        }),
        name: z.string().openapi({
          example: "T-shirts",
          description: "Category name",
        }),
      })
      .openapi("Category"),
  })
  .openapi("ProductCategory");

export const productResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "Product unique ID",
    }),
    storeId: z.string().uuid().openapi({
      example: "b2e1c1e2-1a9d-4a20-b3e2-4d63b00f203f",
      description: "ID of the store that owns the product",
    }),
    name: z.string().openapi({
      example: "Classic T-Shirt",
      description: "Product name",
    }),
    description: z.string().optional().openapi({
      example: "Comfortable 100% cotton T-shirt perfect for everyday wear",
      description: "Product description",
    }),
    price: z.number().openapi({
      example: 29.99,
      description: "Product price in dollars",
    }),
    stock: z.number().int().openapi({
      example: 100,
      description: "Number of available units in stock",
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
    images: z.array(productImageResponseSchema).openapi({
      description: "List of product images",
    }),
    categories: z.array(productCategorySchema).optional().openapi({
      description: "Categories associated with the product",
    }),
    createdBy: z.string().uuid().openapi({
      example: "c31f6f54-7c31-4d8a-9409-9d2c0eb2a6c3",
      description: "User ID who created the product",
    }),
    updatedBy: z.string().uuid().openapi({
      example: "c31f6f54-7c31-4d8a-9409-9d2c0eb2a6c3",
      description: "User ID who last updated the product",
    }),
    createdAt: z.string().datetime().openapi({
      example: "2025-11-09T11:23:45.000Z",
      description: "Date the product was created",
    }),
    updatedAt: z.string().datetime().openapi({
      example: "2025-11-09T11:23:45.000Z",
      description: "Date the product was last updated",
    }),
  })
  .openapi("ProductResponse");

export const getProductSuccessResponseSchema = z
  .object({
    data: productResponseSchema,
  })
  .openapi("GetProductSuccessResponse");

export const createProductSuccessResponseSchema = z
  .object({
    data: productResponseSchema,
  })
  .openapi("CreateProductSuccessResponse");

export const deleteProductResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Product deleted successfully",
      description: "Confirmation message after product deletion",
    }),
    data: z
      .object({
        productId: z.string().uuid(),
        deletedAt: z.string().openapi({
          example: "2025-11-09T11:23:45.000Z",
          description: "Timestamp when the product was deleted",
        }),
      })
      .openapi({
        description: "Details of the deleted product",
      }),
  })
  .openapi("DeleteProductResponse");

export const getAllProductsResponseSchema = z
  .object({
    data: z.object({
      products: z.array(getProductSuccessResponseSchema.shape.data),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
  })
  .openapi("GetAllProductsResponse");

export type ProductResponse = z.infer<typeof productResponseSchema>;
export type CreateProductSuccessResponse = z.infer<
  typeof createProductSuccessResponseSchema
>;
export type GetProductSuccessResponse = z.infer<
  typeof getProductSuccessResponseSchema
>;

export type FilterProductsWithPagination = z.infer<
  typeof filterProductAndPaginationSchema
>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema>;
