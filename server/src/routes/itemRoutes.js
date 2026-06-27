import { Router } from "express";
import {
  createItem,
  deleteItem,
  getItems,
  getStockByDate,
  updateDailyStock,
  updateItem
} from "../controllers/itemController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", getItems);
router.get("/stock", protect, allowRoles("admin", "worker"), getStockByDate);
router.post("/", protect, allowRoles("admin", "worker"), createItem);
router.patch("/:id/daily-stock", protect, allowRoles("admin", "worker"), updateDailyStock);
router.put("/:id", protect, allowRoles("admin", "worker"), updateItem);
router.delete("/:id", protect, allowRoles("admin", "worker"), deleteItem);

export default router;
