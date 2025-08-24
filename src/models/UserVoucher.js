import mongoose from "mongoose";

const { Schema } = mongoose;

const userVoucherSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    discountId: { 
      type: Schema.Types.ObjectId, 
      ref: "Discount", 
      required: true 
    },
    used: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

const UserVoucher = mongoose.model("UserVoucher", userVoucherSchema);

export default UserVoucher;
