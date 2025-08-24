import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import querystring from "querystring";

import authController from "../controllers/authController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const authRoutes = Router();

// ==== Tạo JWT token ====
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ==== Local Auth ====
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);

// ==== Forgot / Reset Password ====
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password/:token", authController.resetPassword);


// ==== OAuth Callback Handler ====
function handleOAuthSuccess(req, res) {
  const token = generateToken(req.user);
  const user = req.user;

  const redirectParams = querystring.stringify({
    token,
    user: JSON.stringify({
      _id: user._id,
      email: user.email,
      fullname: user.fullname || user.displayName || user.username || "User",
      role: user.role || "user",
    }),
  });

  res.redirect(`http://localhost:5173/oauth-success?${redirectParams}`);
}

// ==== Google OAuth ====
authRoutes.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRoutes.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), handleOAuthSuccess);

// ==== Facebook OAuth ====
authRoutes.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
authRoutes.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/" }), handleOAuthSuccess);

// ==== GitHub OAuth ====
authRoutes.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
authRoutes.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/" }), handleOAuthSuccess);

// ==== Test Profile (nếu dùng session) ====
authRoutes.get("/profile", (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Chưa đăng nhập" });

  const name = user.fullname || user.displayName || user.username || "User";
  res.json({ success: true, name });
});

// ==== Logout (nếu dùng session) ====
authRoutes.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// ==== Quản lý người dùng ====


authRoutes.put("/users/:id/change-password", verifyToken, authController.changePassword);


authRoutes.get("/users", verifyToken, authController.getAllUsers);
authRoutes.get("/users/:id", verifyToken, authController.getUserById);
authRoutes.put("/users/:id", verifyToken, authController.updateUser);
authRoutes.delete("/users/:id", verifyToken, isAdmin, authController.deleteUser);

export default authRoutes;
