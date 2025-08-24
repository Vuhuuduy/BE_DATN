import Discount from "../models/discount.js"
import mongoose from "mongoose"
import UserVoucher from "../models/UserVoucher.js"

// 🟢 Lấy tất cả mã giảm giá
export const getAllDiscounts = async (req, res, next) => {
  try {
    const { scope, userId } = req.query

    let filter = {}
    if (scope === "client") {
      filter.status = "active" // client chỉ thấy active
    }

    // Lấy tất cả voucher
    const discounts = await Discount.find(filter)

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      // Lấy danh sách voucher mà user đã claim (kể cả chưa dùng hay đã dùng)
      const userVouchers = await UserVoucher.find({ userId }).select("discountId")
      const takenIds = userVouchers.map(v => String(v.discountId))

      // Lọc bỏ những cái user đã claim
      const availableDiscounts = discounts.filter(
        d => !takenIds.includes(String(d._id))
      )

      return res.json({ success: true, data: availableDiscounts })
    }

    res.json({ success: true, data: discounts })
  } catch (error) {
    next(error)
  }
}

// 🟢 Lấy mã giảm giá theo ID
export const getDiscountById = async (req, res, next) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "ID mã giảm giá không hợp lệ",
    })
  }

  try {
    const discount = await Discount.findById(id)
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá",
      })
    }

    res.json({ success: true, data: discount })
  } catch (error) {
    next(error)
  }
}

// 🟢 Thêm mã giảm giá mới
export const addDiscount = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      minOrderValue,
      date,
      status
    } = req.body

    // Kiểm tra trùng mã code
    const existingDiscount = await Discount.findOne({ code })
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã tồn tại",
      })
    }

    const newDiscount = new Discount({
      code,
      discount_type,
      discount_value,
      minOrderValue,
      date,
      status
    })

    await newDiscount.save()

    res.status(201).json({
      success: true,
      data: newDiscount,
    })
  } catch (error) {
    next(error)
  }
}

// 🟢 Cập nhật mã giảm giá
export const updateDiscount = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      minOrderValue,
      date,
      status
    } = req.body

    const { id } = req.params

    // Kiểm tra trùng mã (trừ bản ghi đang sửa)
    const existingDiscount = await Discount.findOne({
      code,
      _id: { $ne: id }
    })

    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã tồn tại",
      })
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        code,
        discount_type,
        discount_value,
        minOrderValue,
        date,
        status
      },
      { new: true }
    )

    if (!updatedDiscount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã khuyến mãi",
      })
    }

    res.json({
      success: true,
      data: updatedDiscount,
    })
  } catch (error) {
    next(error)
  }
}

// 🟢 Xóa mã giảm giá
export const deleteDiscount = async (req, res, next) => {
  try {
    const deletedDiscount = await Discount.findByIdAndDelete(req.params.id)
    if (!deletedDiscount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã khuyến mại",
      })
    }

    res.json({
      success: true,
      message: "Xóa mã giảm giá thành công",
    })
  } catch (error) {
    next(error)
  }
}

// 🟢 Lấy voucher của user
export const getUserVoucher = async (req, res, next) => {
  const { userId } = req.params
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ success: false, message: "ID không hợp lệ" })

  try {
    const vouchers = await UserVoucher.find({ userId }).populate("discountId")
    res.json({ success: true, data: vouchers })
  } catch (err) {
    next(err)
  }
}

// 🟢 Lưu voucher cho user
export const saveUserVoucher = async (req, res, next) => {
  const { userId } = req.params
  const { discountId } = req.body

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(discountId)
  ) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" })
  }

  try {
    const already = await UserVoucher.findOne({ userId, discountId })
    if (already) {
      return res.status(400).json({ success: false, message: "Voucher đã được lưu" })
    }

    const newVoucher = await UserVoucher.create({ userId, discountId, used: false })

    res.json({ success: true, data: newVoucher })
  } catch (err) {
    next(err)
  }
}

// 🟢 Xóa voucher của user
export const removeUserVoucher = async (req, res, next) => {
  const { userId } = req.params
  const { discountId } = req.body

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(discountId)
  ) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" })
  }

  try {
    await UserVoucher.findOneAndDelete({ userId, discountId })
    res.json({ success: true, message: "Xóa voucher khỏi user thành công" })
  } catch (err) {
    next(err)
  }
}

// 🟢 Đổi trạng thái mã giảm giá
export const toggleDiscountStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID mã giảm giá không hợp lệ",
      })
    }

    const discount = await Discount.findById(id)
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá",
      })
    }

    // Đổi trạng thái
    discount.status = discount.status === "active" ? "inactive" : "active"
    await discount.save()

    res.json({
      success: true,
      message: `Đã chuyển mã giảm giá sang trạng thái ${discount.status}`,
      data: discount,
    })
  } catch (error) {
    next(error)
  }
}
