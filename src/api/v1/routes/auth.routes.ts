import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSchema } from "../../middlewares/schemaValidator";
import { registerSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateSchema(registerSchema, null, null),
  AuthController.register
);

export default router;
