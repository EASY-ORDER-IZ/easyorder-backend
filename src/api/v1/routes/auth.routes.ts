import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import { registerSchema, verifyOtpSchema } from "../schemas/auth.schema";

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

export default router;
