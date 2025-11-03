import type { Request } from "express";
import type {
  CreateProductRequest,
  FilterProductsWithPagination,
} from "../schemas/product.schema";

export type CreateProductRequestType = Request & {
  body: CreateProductRequest;
};

export type GetProductsRequestType = Request & {
  query: FilterProductsWithPagination;
};
