import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import {
  logoutSchema,
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from "../schemas/auth.schema";
import { authenticate } from "../../middlewares/auth.middleware";

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
  "/logout",
  validateSchema(logoutSchema, null, null),
  authenticate(),
  AuthController.logout
);
export default router;
