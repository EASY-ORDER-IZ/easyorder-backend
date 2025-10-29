import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import {
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateSchema(registerSchema, null, null),
  AuthController.register
);

router.post(
  "/verify-otp",
  validateSchema(verifyOtpSchema, null, null),
  AuthController.verifyOtp
);

router.post(
  "/resend-otp",
  validateSchema(resendOtpSchema, null, null),
  AuthController.resendOtp
);

router.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema, null, null),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validateSchema(resetPasswordSchema, null, null),
  AuthController.resetPassword
);

export default router;
