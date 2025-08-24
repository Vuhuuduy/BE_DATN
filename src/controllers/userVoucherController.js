import UserVoucher from "../models/UserVoucher.js";
import mongoose from "mongoose";

// Lấy tất cả voucher chưa dùng của user
export const getUserVouchers = async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ success: false, message: "UserId không hợp lệ" });

  try {
    const vouchers = await UserVoucher.find({ userId, used: false }).populate("discountId");
    res.json({ success: true, data: vouchers });
  } catch (err) {
    next(err);
  }
};

// Lưu voucher mới cho user
export const saveUserVoucher = async (req, res, next) => {
  const { userId } = req.params;
  const { discountId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(discountId))
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });

  try {
    // Kiểm tra voucher đã lưu chưa
    const existing = await UserVoucher.findOne({ userId, discountId });
    if (existing)
      return res.status(400).json({ success: false, message: "Voucher đã được lưu" });

    const newVoucher = new UserVoucher({ userId, discountId });
    await newVoucher.save();

    res.status(201).json({ success: true, data: newVoucher });
  } catch (err) {
    next(err);
  }
};

// Xóa voucher của user
export const removeUserVoucher = async (req, res, next) => {
  const { userId, discountId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(discountId))
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });

  try {
    const deleted = await UserVoucher.findOneAndDelete({ userId, discountId });
    if (!deleted) return res.status(404).json({ success: false, message: "Voucher không tồn tại" });

    res.json({ success: true, message: "Xóa voucher thành công" });
  } catch (err) {
    next(err);
  }
};

// Đánh dấu voucher đã dùng
// 

export const useVoucher = async (req, res, next) => {
  const { userId, discountId } = req.params;

  console.log("➡️ useVoucher API gọi với:", { userId, discountId });

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(discountId)) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  try {
    const voucher = await UserVoucher.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        discountId: new mongoose.Types.ObjectId(discountId),
      },
      { $set: { used: true } },
      { new: true }
    );

    if (!voucher) {
      console.log("❌ Không tìm thấy voucher để update");
      return res.status(404).json({ success: false, message: "Voucher không tồn tại" });
    }

    console.log("✅ Voucher sau khi update:", voucher);
    res.json({ success: true, data: voucher });
  } catch (err) {
    console.error("❌ Lỗi useVoucher:", err);
    next(err);
  }
};