import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
     helpful: { type: Number, default: 0 }, // đếm số lượt like
  replies: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
   status: { 
      type: String, 
      enum: ["active", "hidden"], 
      default: "active" 
    } // <-- thêm trạng thái ẩn/hiện

  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
