import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategorySlug
} from "../controllers/productController.js";

const productRoutes = Router();

productRoutes.get("/", getAllProducts);
productRoutes.get("/category/:slug/products", getProductsByCategorySlug); // chuyển thành route rõ ràng hơn
productRoutes.get("/:id", getProductById);
productRoutes.post("/add", addProduct);
productRoutes.put("/:id", updateProduct);
productRoutes.delete("/:id", deleteProduct);



export default productRoutes;
