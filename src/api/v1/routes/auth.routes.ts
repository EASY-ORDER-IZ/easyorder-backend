import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../../middlewares/schemaValidator";
import {
  logoutSchema,
  registerSchema,
  loginSchema,
  resendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../schemas/auth.schema";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/register",
  validate(registerSchema, null, null),
  AuthController.register
);

router.post("/login", validate(loginSchema, null, null), AuthController.login);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema, null, null),
  AuthController.verifyOtp
);

router.post(
  "/resend-otp",
  validate(resendOtpSchema, null, null),
  AuthController.resendOtp
);

router.post(
  "/logout",
  validate(logoutSchema, null, null),
  authenticate,
  AuthController.logout
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema, null, null),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema, null, null),
  AuthController.resetPassword
);

router.post(
  "/refresh-token",
  validate(refreshTokenSchema, null, null),
  AuthController.refreshToken
);

router.get("/me", authenticate, AuthController.getProfile);

export default router;
