import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    price: {
      type: Number,
      required: true,
      min: 0, // ✅ tránh giá âm
    },
    stock_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    image_URL: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Variant", variantSchema);
