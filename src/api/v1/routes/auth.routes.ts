import { Router } from "express";
import { AuthController } from "../controllers/auth.controller"; // Assuming AuthController exists
import { validateSchema } from "../../middlewares/schemaValidator"; // Assuming validateSchema exists
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} from "../schemas/auth.schema";

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
router.post(
  "/verify-otp",
  validateSchema(verifyOtpSchema, null, null),
  AuthController.verifyOtp
);

export default router;
