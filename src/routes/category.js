import express from "express";
import {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategorySlug
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/active", getActiveCategories);

// 👇 Quan trọng: đặt trước để tránh xung đột
router.get("/:slug/products", getProductsByCategorySlug);

router.get("/:id", getCategoryById);
router.post("/", addCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);


export default router;