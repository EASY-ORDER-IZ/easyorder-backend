import { AppDataSource } from "../configs/database";
import { Product } from "../entities/Product";
import { ProductImage } from "../entities/ProductImage";
import { Store } from "../entities/Store";
import type { CreateProductRequest } from "../api/v1/schemas/product.schema";
import { CustomError } from "../utils/custom-error";
import logger from "../configs/logger";

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private productImageRepository = AppDataSource.getRepository(ProductImage);
  private storeRepository = AppDataSource.getRepository(Store);

  async createProduct(
    storeId: string,
    userId: string,
    productData: CreateProductRequest
  ): Promise<Product> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, ownerId: userId },
    });

    if (!store) {
      throw new CustomError(
        "Store not found or you don't have permission to add products",
        404,
        "STORE_NOT_FOUND"
      );
    }

    logger.debug(`Creating product "${productData.name}" for store ${storeId}`);

    const product = this.productRepository.create({
      storeId: storeId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      size: productData.size,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedProduct = await this.productRepository.save(product);

    logger.info(`Product created with ID: ${savedProduct.id}`);

    for (const imageData of productData.images) {
      const productImage = this.productImageRepository.create({
        productId: savedProduct.id,
        imageName: imageData.imageName,
        isPrimary: imageData.isPrimary,
        createdBy: userId,
      });

      await this.productImageRepository.save(productImage);
    }

    logger.info(
      `Created ${productData.images.length} images for product ${savedProduct.id}`
    );

    const productWithImages = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ["images"],
    });

    if (!productWithImages) {
      throw new CustomError(
        "Failed to retrieve created product",
        500,
        "PRODUCT_RETRIEVAL_FAILED"
      );
    }

    return productWithImages;
  }
}
