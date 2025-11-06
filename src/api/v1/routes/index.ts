import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import fileRoutes from "./file.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/files", fileRoutes);

export default router;
