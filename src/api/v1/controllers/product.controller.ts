import type { Response, NextFunction } from "express";
import type {
  CreateProductRequestType,
  GetProductByIdRequestType,
} from "../requests/product.request";
import type {
  CreateProductSuccessResponse,
  GetProductSuccessResponse,
} from "../responses/product.response";
import { toProductResponse } from "../responses/product.response";
import { ProductService } from "../../../services/product.service";
import logger from "../../../configs/logger";
import { CustomError } from "../../../utils/custom-error";
import type { ValidatedRequest } from "../../middlewares/schemaValidator";
import type {
  FilterProductsWithPagination,
  ProductIdParam,
  UpdateProductRequest,
} from "../schemas/product.schema";

export class ProductController {
  private static productService = new ProductService();

  static async create(
    req: CreateProductRequestType,
    res: Response<CreateProductSuccessResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const productData = req.body;

      const user = req.user;

      if (!user) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      const storeId = user.storeId;

      if (storeId === null || storeId === undefined) {
        throw new CustomError(
          "Store not found for this user",
          404,
          "STORE_NOT_FOUND"
        );
      }

      logger.info(
        `Creating product for store ${storeId} by user ${user.userId}`
      );

      const product = await ProductController.productService.createProduct(
        storeId,
        user.userId,
        productData
      );

      logger.info(`Product created successfully: ${product.id}`);

      const productResponse = toProductResponse(product);

      res.status(201).json({
        data: productResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: GetProductByIdRequestType,
    res: Response<GetProductSuccessResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.params;

      const user = req.user;

      if (!user) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      const product = await ProductController.productService.getProductById(
        productId,
        user.userId,
        user.storeId
      );

      const productResponse = toProductResponse(product);

      res.status(200).json({
        data: productResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(
    req: ValidatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user;

      if (user === undefined || user === null) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      const storeId = user.storeId;

      if (storeId === null || storeId === undefined) {
        throw new CustomError(
          "Store not found for this user",
          404,
          "STORE_NOT_FOUND"
        );
      }

      const query = req.validatedQuery as FilterProductsWithPagination;

      logger.info(
        `Fetching products for store ${storeId} by user ${user.userId}`
      );

      const result = await ProductController.productService.getAllProducts(
        storeId,
        user.userId,
        query
      );

      logger.info(
        `Fetched ${result.products.length} products for store ${storeId}`
      );

      const productResponses = result.products.map(toProductResponse);

      res.status(200).json({
        data: {
          products: productResponses,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(
    req: ValidatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.validatedParams as ProductIdParam;
      const updateData = req.validatedBody as UpdateProductRequest;
      const userId = req.user?.userId;

      if (userId === undefined || userId === null) {
        throw new CustomError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const storeId = req.user?.storeId;

      if (storeId === undefined || storeId === null) {
        throw new CustomError(
          "Store not found for this user",
          404,
          "STORE_NOT_FOUND"
        );
      }

      logger.info(`Updating product ${productId} by user ${userId}`);

      const updatedProduct =
        await ProductController.productService.updateProduct(
          productId,
          storeId,
          userId,
          updateData
        );

      res.status(200).json({
        data: updatedProduct,
        message: "Product updated successfully",
      });
    } catch (error) {
      logger.error("Error updating product:", error);
      next(error);
    }
  }
}
