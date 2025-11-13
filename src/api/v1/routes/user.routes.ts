import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateSchema } from "../../middlewares/schemaValidator";
import { createStoreSchema } from "../schemas/user.schema";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { Role } from "../../../constants";

const router = Router();

router.post(
  "/create-store",
  validateSchema(createStoreSchema, null, null),
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  UserController.createStore
);

export default router;
