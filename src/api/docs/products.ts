import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  createProductSchema,
  getProductByIdSchema,
  getProductSuccessResponseSchema,
  deleteProductResponseSchema,
  filterProductAndPaginationSchema,
  getAllProductsResponseSchema,
  updateProductSchema,
  productIdParamSchema,
} from "../v1/schemas/product.schema";

const productPath = "/api/v1/products";

export const ProductDocs = (registry: OpenAPIRegistry): void => {
  registry.register("CreateProductRequest", createProductSchema);

  registry.registerPath({
    path: `${productPath}/`,
    method: "post",
    summary: "Create a new product",
    tags: ["Products"],
    description:
      "Adds a new product to the store with images and category paths.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createProductSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Product created successfully",
        content: {
          "application/json": {
            schema: createProductSchema,
          },
        },
      },
      401: { description: "User not authenticated" },
      403: { description: "User not authorized" },
      404: { description: "Store not found" },
      500: { description: "Internal server error" },
    },
  });

  registry.registerPath({
    path: `${productPath}/{productId}`,
    method: "get",
    summary: "Get a product by ID",
    tags: ["Products"],
    description:
      "Retrieves a specific product by its UUID, including its images, categories, and store details.",
    security: [{ bearerAuth: [] }],
    request: {
      params: getProductByIdSchema,
    },
    responses: {
      200: {
        description: "Product retrieved successfully",
        content: {
          "application/json": {
            schema: getProductSuccessResponseSchema,
          },
        },
      },
      401: { description: "User not authenticated" },
      403: { description: "User not authorized or store not found" },
      404: { description: "Product not found" },
      500: { description: "Internal server error" },
    },
  });

  registry.registerPath({
    path: `${productPath}/{productId}`,
    method: "delete",
    summary: "Soft delete a product",
    tags: ["Products"],
    description:
      "Soft deletes a product by its UUID. The product is marked as deleted and its images are soft deleted.",
    security: [{ bearerAuth: [] }],
    request: {
      params: getProductByIdSchema,
    },
    responses: {
      200: {
        description: "Product soft deleted successfully",
        content: {
          "application/json": {
            schema: deleteProductResponseSchema,
          },
        },
      },
      401: { description: "User not authenticated" },
      403: { description: "User not authorized or store not found" },
      404: { description: "Product not found" },
      500: { description: "Internal server error" },
    },
  });

  registry.registerPath({
    path: `${productPath}/`,
    method: "get",
    summary: "Get all products with filtering and pagination",
    tags: ["Products"],
    description:
      "Retrieves all products for a store with optional filters, sorting, and pagination.",
    security: [{ bearerAuth: [] }],
    request: {
      query: filterProductAndPaginationSchema,
    },
    responses: {
      200: {
        description: "Products retrieved successfully",
        content: {
          "application/json": {
            schema: getAllProductsResponseSchema,
          },
        },
      },
      401: { description: "User not authenticated" },
      403: { description: "User not authorized or store not found" },
      404: { description: "Store not found" },
      500: { description: "Internal server error" },
    },
  });

  registry.registerPath({
    path: `${productPath}/{productId}`,
    method: "patch",
    summary: "Update a product",
    tags: ["Products"],
    description:
      "Updates a product by its UUID. Allows partial updates of product details and images.",
    security: [{ bearerAuth: [] }],
    request: {
      params: productIdParamSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateProductSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Product updated successfully",
        content: {
          "application/json": {
            schema: getProductSuccessResponseSchema,
          },
        },
      },
      401: { description: "User not authenticated" },
      403: { description: "User not authorized or store not found" },
      404: { description: "Product not found" },
      500: { description: "Internal server error" },
    },
  });
};
