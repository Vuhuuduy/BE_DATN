import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart
} from "../controllers/cartController.js";

const cartRoutes = express.Router();

cartRoutes.get("/:userId", getCart);
cartRoutes.post("/:userId", addToCart);
cartRoutes.delete("/:userId", removeFromCart);
cartRoutes.put("/:userId", updateQuantity);
cartRoutes.delete("/:userId/clear", clearCart);

export default cartRoutes;
