import type { Response, NextFunction } from "express";
import type {
  CreateProductRequestType,
  DeleteProductRequestType,
  GetProductByIdRequestType,
} from "../requests/product.request";
import type {
  CreateProductSuccessResponse,
  DeleteProductSuccessResponse,
  GetProductSuccessResponse,
} from "../responses/product.response";
import { toProductResponse } from "../responses/product.response";
import { ProductService } from "../../../services/product.service";
import logger from "../../../configs/logger";
import { CustomError } from "../../../utils/custom-error";

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

  static async softDelete(
    req: DeleteProductRequestType,
    res: Response<DeleteProductSuccessResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.params;

      const user = req.user;

      if (user === null || user === undefined) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      logger.info(
        `ADMIN user ${user.userId} soft deleting product: ${productId}`
      );

      const result = await ProductController.productService.softDeleteProduct(
        productId,
        user.userId,
        user.storeId
      );

      logger.info(`Product soft deleted successfully: ${productId}`);

      res.status(200).json({
        message: "Product successfully deleted",
        data: {
          productId: result.productId,
          deletedAt: result.deletedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
