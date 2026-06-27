import { Router } from "express";
import { createSale, getProfitReport, getSales, getSalesSummary } from "../controllers/saleController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, allowRoles("admin"), getSales);
router.get("/summary", protect, allowRoles("admin"), getSalesSummary);
router.get("/profit", protect, allowRoles("admin"), getProfitReport);
router.post("/", protect, allowRoles("admin", "worker"), createSale);

export default router;
