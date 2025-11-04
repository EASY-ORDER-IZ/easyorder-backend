import { IsNull } from "typeorm";
import { AppDataSource } from "../configs/database";
import { Product } from "../entities/Product";
import { ProductImage } from "../entities/ProductImage";
import { Store } from "../entities/Store";
import type {
  CreateProductRequest,
  FilterProductsWithPagination,
} from "../api/v1/schemas/product.schema";
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
    const store = await this.storeRepository.exists({
      where: { id: storeId, ownerId: userId },
    });

    if (!store) {
      throw new CustomError(
        "Store not found or you don't have permission to add products",
        404,
        "STORE_NOT_FOUND"
      );
    }

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

  async getProductById(
    productId: string,
    userId: string,
    userStoreId?: string
  ): Promise<Product> {
    if (userStoreId === null || userStoreId === undefined) {
      throw new CustomError("Store not found for this user", 403, "FORBIDDEN");
    }

    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        deletedAt: IsNull(),
      },
      relations: ["images", "store"],
    });

    if (!product) {
      throw new CustomError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (product.storeId !== userStoreId) {
      throw new CustomError(
        "You don't have permission to view this product",
        403,
        "FORBIDDEN"
      );
    }

    if (product.images.length > 0) {
      product.images = product.images.filter((img) => !img.deletedAt);
    }

    return product;
  }

  async softDeleteProduct(
    productId: string,
    userId: string,
    userStoreId?: string
  ): Promise<{ productId: string; deletedAt: string }> {
    if (userStoreId === null || userStoreId === undefined) {
      throw new CustomError("Store not found for this user", 403, "FORBIDDEN");
    }

    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        deletedAt: IsNull(),
      },
    });

    if (!product) {
      throw new CustomError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (product.storeId !== userStoreId) {
      throw new CustomError(
        "You don't have permission to delete this product",
        403,
        "FORBIDDEN"
      );
    }

    const now = new Date();
    product.deletedAt = now;
    product.updatedBy = userId;

    await this.productRepository.save(product);

    await this.productImageRepository.softDelete({ productId });

    return {
      productId: productId,
      deletedAt: now.toISOString(),
    };
  }

  async getAllProducts(
    storeId: string,
    userId: string,
    query: FilterProductsWithPagination
  ): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      name,
      size,
      price,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = query;

    const store = await this.storeRepository.exists({
      where: { id: storeId, ownerId: userId },
    });

    if (!store) {
      throw new CustomError(
        "Store not found or you don't have permission to view products",
        404,
        "STORE_NOT_FOUND"
      );
    }

    const qb = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.images", "images")
      .where("product.storeId = :storeId", { storeId });

    if (name !== undefined && name !== null) {
      qb.andWhere("LOWER(product.name) LIKE :name", {
        name: `%${name.toLowerCase()}%`,
      });
    }
    if (size && size.length > 0) {
      qb.andWhere("product.size IN (:...sizes)", { sizes: size });
    }
    if (price !== undefined && price !== null) {
      qb.andWhere("product.price = :price", { price });
    }
    if (minPrice !== undefined && minPrice !== null) {
      qb.andWhere("product.price >= :minPrice", { minPrice });
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      qb.andWhere("product.price <= :maxPrice", { maxPrice });
    }

    const orderBy = sortBy;
    const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";
    qb.orderBy(`product.${orderBy}`, orderDirection);

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    qb.skip(skip).take(take);

    const [products, total] = await qb.getManyAndCount();

    logger.debug(
      `Fetched ${products.length} products for store ${storeId} (page ${page}/${Math.ceil(
        total / take
      )})`
    );

    return {
      products,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
