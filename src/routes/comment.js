import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import {
  getCommentsByProduct,
  addComment,
  deleteComment,
  getAllComments,
  likeComment,
  replyComment,
  deleteReply
} from "../controllers/commentController.js";

const commentRoutes = express.Router();

// Lấy tất cả bình luận cho Admin
commentRoutes.get("/", verifyToken, isAdmin, getAllComments);

// Lấy bình luận của 1 sản phẩm
commentRoutes.get("/:productId", getCommentsByProduct);

// Thêm bình luận
commentRoutes.post("/:productId", verifyToken, addComment);

// Xóa bình luận
commentRoutes.delete("/:id", verifyToken, deleteComment);

// Like bình luận
commentRoutes.patch("/:id/like", verifyToken, likeComment);

// Trả lời bình luận
commentRoutes.post("/:id/reply", verifyToken, replyComment);


// Xóa trả lời bình luận
commentRoutes.delete("/:commentId/replies/:replyId", verifyToken, isAdmin, deleteReply);


export default commentRoutes;
