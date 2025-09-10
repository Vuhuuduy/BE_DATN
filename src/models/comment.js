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
      isHidden: { type: Boolean, default: false },
        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  replies: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
       isHidden: { type: Boolean, default: false },
    }
  ],


  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
