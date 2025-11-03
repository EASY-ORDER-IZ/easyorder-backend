import type { Request } from "express";
import type { CreateProductRequest } from "../schemas/product.schema";

export interface CreateProductRequestType extends Request {
  body: CreateProductRequest;
}
