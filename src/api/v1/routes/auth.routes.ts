import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateSchema(registerSchema, null, null),
  AuthController.register
);
router.post(
  "/login",
  validateSchema(loginSchema, null, null),
  AuthController.login
);

export default router;
