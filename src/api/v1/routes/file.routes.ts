import { Router } from "express";
import { FileController } from "../controllers/file.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateSchema } from "../../middlewares/schemaValidator";
import { generatePresignedUrlSchema } from "../schemas/file.schema";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { Role } from "../../../constants";

const router = Router();

router.post(
  "/upload",
  authenticate,
  authorizeRoles(Role.ADMIN),
  validateSchema(generatePresignedUrlSchema, null, null),
  FileController.generatePresignedUrl
);

export default router;
