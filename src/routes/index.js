import { Router } from "express";

// Sub-routes

import authRoutes from "./auth.js";
import productRoutes from "./product.js";



const routes = Router();

// === Route chính ===
routes.use("/", authRoutes);
routes.use("/products", productRoutes);;


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
