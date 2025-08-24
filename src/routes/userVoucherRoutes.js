import { Router } from "express";
import { 
  getUserVouchers, 
  saveUserVoucher, 
  removeUserVoucher, 
  useVoucher 
} from "../controllers/userVoucherController.js";

const router = Router();

// Lấy voucher của user
router.get("/:userId", getUserVouchers);

// Lưu voucher mới cho user
router.post("/:userId", saveUserVoucher);

// Xóa voucher
router.delete("/:userId/:discountId", removeUserVoucher);

// Đánh dấu voucher đã dùng
router.patch("/:userId/:discountId/use", useVoucher);

export default router;