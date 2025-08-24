import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Chờ xác nhận" , "Đã xác nhận"  , "Đang giao hàng" , "Đã hủy" , "Đã hoàn thành" , "Đã hoàn tiền"],
      default: "Chờ xác nhận",
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    orderItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
       
        image: String,
      },
    ],

    shippingInfo: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      note: { type: String },
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentMethod:{
        type: String,
    },
     cancelReason: {
      type: String,
      default: null, // ✅ Quan trọng để lưu lý do hủy
    },
    
  },
  {
    timestamps: true,
  }
); 

const Order = mongoose.model("Order", orderSchema);
export default Order;