import type { ProductSize } from "../../../constants";
import type { Product } from "../../../entities/Product";
import type { ProductImage } from "../../../entities/ProductImage";

export interface ProductImageResponse {
  id: string;
  imageName: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductResponse {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  size?: ProductSize;
  images: ProductImageResponse[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductSuccessResponse {
  data: ProductResponse;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ message: string }>;
  };
}

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    size: product.size,
    images: product.images?.map((img) => toProductImageResponse(img)) ?? [],
    createdBy: product.createdBy!,
    updatedBy: product.updatedBy!,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function toProductImageResponse(image: ProductImage): ProductImageResponse {
  return {
    id: image.id,
    imageName: image.imageName,
    isPrimary: image.isPrimary,
    createdAt: image.createdAt.toISOString(),
  };
}
