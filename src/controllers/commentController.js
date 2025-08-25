import Comment from "../models/comment.js";

// Lấy tất cả bình luận (Admin) với phân trang và tìm kiếm
export const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = "" } = req.query;

    const searchQuery = keyword
      ? { content: { $regex: keyword, $options: "i" } }
      : {};

    const skip = (page - 1) * limit;

    const comments = await Comment.find(searchQuery)
      .populate("userId", "fullname email")
      .populate("productId", "name slug")
       .populate("replies.userId", "fullname email") 

      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Comment.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllComments error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Lấy tất cả bình luận theo sản phẩm
export const getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId là bắt buộc" });
    }

    const comments = await Comment.find({ productId })
      .populate("userId", "fullname")
      .populate("replies.userId", "fullname")
       .populate("replies.userId", "fullname email") 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error("getCommentsByProduct error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thêm bình luận
export const addComment = async (req, res) => {
  try {
    const { productId } = req.params;
    const { content, rating } = req.body;
    const userId = req.user?.id;

   
    const newComment = await Comment.create({ productId, userId, content: content.trim(), rating });
    const populatedComment = await newComment.populate("userId", "fullname");

    res.status(201).json({ success: true, message: "Thêm bình luận thành công", data: populatedComment });
  } catch (error) {
    console.error("addComment error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa bình luận
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role; // lấy role từ token

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });

    // Cho phép xóa nếu là admin hoặc là người tạo bình luận
    if (comment.userId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xóa" });
    }

    await Comment.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Xóa bình luận thành công" });
  } catch (error) {
    console.error("deleteComment error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};


// Like comment
export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    comment.helpful += 1;
    await comment.save();

    res.json({ message: "Đã like", helpful: comment.helpful });
  } catch (error) {
    console.error("likeComment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Trả lời comment
export const replyComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content || content.trim() === "") return res.status(400).json({ success: false, message: "Nội dung trả lời là bắt buộc" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    comment.replies.push({ userId, content: content.trim() });
    await comment.save();

    const updatedComment = await Comment.findById(id)
      .populate("userId", "fullname")
      .populate("replies.userId", "fullname");

    res.json({ message: "Đã trả lời", comment: updatedComment });
  } catch (error) {
    console.error("replyComment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
// Xóa trả lời comment

export const deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    }

    // Tìm index của reply
    const replyIndex = comment.replies.findIndex(r => r._id.toString() === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trả lời" });
    }

    comment.replies.splice(replyIndex, 1);
    await comment.save();

    res.status(200).json({ success: true, message: "Xóa trả lời thành công" });
  } catch (error) {
    console.error("deleteReply error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};