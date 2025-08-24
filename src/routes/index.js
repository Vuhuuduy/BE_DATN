import { Router } from "express";

// Sub-routes
import productRoutes from "./product.js";
import discountRoutes from "./discount.js";
import categoryRoutes from "./category.js";
import orderRoutes from "./order.js";
import variantRoutes from "./variant.js";
import authRoutes from "./auth.js";
import vnPayrouter from "./vnpay.js";
import cartRoutes from "./cart.js";
import statsRoutes from "./stats.js";
import searchRoutes from "./search.js";
import userVoucherRoutes from "./userVoucherRoutes.js";
import contactRoutes from "./contact.js"; // 👈 import thêm
import commentRoutes from "./comment.js";// 👈 import thêm


const routes = Router();

// === Route chính ===
routes.use("/", authRoutes);
routes.use("/products", productRoutes);
routes.use("/discounts", discountRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/orders", orderRoutes);
routes.use("/variants", variantRoutes);
routes.use("/vnpay", vnPayrouter);
routes.use("/cart", cartRoutes);
routes.use("/stats", statsRoutes);
routes.use("/search", searchRoutes);
routes.use("/voucher", userVoucherRoutes);
routes.use("/contact", contactRoutes); // 👈 gắn route liên hệ
routes.use("/comments", commentRoutes);



// === Test route trang chủ BE (không ảnh hưởng FE) ===
routes.get("/", (req, res) => {
  res.send(`
    <h2>Login Options</h2>
    <a href='/auth/google'>Login With Google</a><br/>
    <a href='/auth/facebook'>Login With Facebook</a><br/>
    <a href='/auth/github'>Login With GitHub</a>
  `);
});



// === Fallback 404 ===
routes.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

export default routes;
