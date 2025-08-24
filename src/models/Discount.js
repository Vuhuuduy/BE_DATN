import mongoose from "mongoose";

const { Schema } = mongoose;

const discountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // đảm bảo không trùng mã
      trim: true,
    },
    discount_type: {
      type: String,
      enum: ["%", "vnd"],
      required: true,
    },
    discount_value: {
      type: Number, // ← Đã sửa từ String sang Number
      required: true,
    },
    minOrderValue: {
      type: Number, // ← Thêm trường này
      required: true,
    },
    date: {
      type: [Date], // ← Mảng ngày [start, end]
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "Trường `date` phải là mảng gồm 2 ngày: [start, end]",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;