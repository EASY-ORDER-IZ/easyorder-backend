import type { Request } from "express";
import type { CreateStoreRequest } from "../schemas/user.schema";

export interface CreateStoreRequestType extends Request {
  body: CreateStoreRequest;
}
