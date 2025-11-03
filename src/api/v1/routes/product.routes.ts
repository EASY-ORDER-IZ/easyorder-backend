import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import { createProductSchema } from "../schemas/product.schema";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  validateSchema(createProductSchema, null, null),
  authenticate,
  ProductController.create
);

export default router;
