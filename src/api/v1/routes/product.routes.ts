import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import {
  createProductSchema,
  getProductByIdSchema,
} from "../schemas/product.schema";
import { authenticate } from "../../middlewares/auth.middleware";
import { Role } from "../../../constants";
import { authorizeRoles } from "../../middlewares/authorize.middleware";

const router = Router();

router.post(
  "/",
  validateSchema(createProductSchema, null, null),
  authenticate,
  authorizeRoles(Role.ADMIN),
  ProductController.create
);

router.get(
  "/:productId",
  authenticate,
  authorizeRoles(Role.ADMIN),
  validateSchema(null, null, getProductByIdSchema),
  ProductController.getById
);

router.delete(
  "/:productId",
  authenticate,
  authorizeRoles(Role.ADMIN),
  validateSchema(null, null, getProductByIdSchema),
  ProductController.softDelete
);

export default router;
