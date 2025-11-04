import type { Request } from "express";
import type {
  CreateProductRequest,
  GetProductByIdParams,
} from "../schemas/product.schema";
export interface CreateProductRequestType extends Request {
  body: CreateProductRequest;
}

export interface GetProductByIdRequestType extends Request {
  params: GetProductByIdParams;
}

export interface DeleteProductRequestType extends Request {
  params: GetProductByIdParams;
}
