import type { Response, NextFunction } from "express";
import type { CreateProductRequestType } from "../requests/product.request";
import type { CreateProductSuccessResponse } from "../responses/product.response";
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
}
