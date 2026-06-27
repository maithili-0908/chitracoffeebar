import { Router } from "express";
import { deleteUser, getUsers, getWorkers, updateUser } from "../controllers/userController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, allowRoles("admin"), getUsers);
router.get("/workers", protect, allowRoles("admin"), getWorkers);
router.put("/:id", protect, allowRoles("admin"), updateUser);
router.delete("/:id", protect, allowRoles("admin"), deleteUser);

export default router;
