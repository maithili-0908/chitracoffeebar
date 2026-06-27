import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "../controllers/categoryController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, allowRoles("admin", "worker"), createCategory);
router.put("/:id", protect, allowRoles("admin"), updateCategory);
router.delete("/:id", protect, allowRoles("admin"), deleteCategory);

export default router;
