import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/order.js";
import UserVoucher from "../models/UserVoucher.js";


export const getAllOrders = async (req, res, next) => {
  try {
    let query = Order.find();

    // Nếu có query ?client=true thì populate thêm productId + sort
    if (req.query.client === "true") {
      query = query
        .populate("userId", "fullname email")
        .populate("orderItems.productId", "name image price")
        .sort({ createdAt: -1 });
    } else {
      // Admin mặc định
      query = query.populate("userId", "fullname email");
    }

    const orders = await query;

    // Trả kết quả theo kiểu phù hợp
    if (req.query.client === "true") {
      res.status(200).json({ success: true, data: orders });
    } else {
      res.status(200).json(orders);
    }
  } catch (error) {
    console.error("Lỗi getAllOrders:", error);
    next(error);
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu userId",
      });
    }

    const orders = await Order.find({ userId })
      .populate({
        path: "userId",
        select: "name email",
      })
      .populate({
        path: "couponId",
        select: "code discount",
      })
      .populate({
        path: "orderItems.productId", // ✅ sửa đúng key
        select: "name price imageUrl", // ✅ đúng tên field ảnh mà frontend dùng
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders: orders || [],
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử đơn hàng",
    });
  }
};


// [GET] /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email")
      .populate("orderItems.productId", "name image price");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Lỗi getOrderById:", error);
    next(error);
  }
};



// [POST] /api/orders
export const addOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      orderItems,
      shippingInfo,
      couponId,
      discountAmount,
      totalAmount,
      paymentMethod,
    } = req.body;

    // Validate
    if (!userId || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Giỏ hàng trống hoặc thiếu userId" });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Tổng tiền không hợp lệ" });
    }

    if (!shippingInfo || !shippingInfo.address) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin địa chỉ" });
    }

    if (!paymentMethod) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu phương thức thanh toán" });
    }

    // Kiểm tra và trừ tồn kho
    for (const item of orderItems) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm ID: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} không đủ tồn kho`,
        });
      }

      product.stock -= item.quantity;
      await product.save({ session });
      const discountPercent = product.discount || 0; // giả sử model Product có field "discount"
      const finalPrice = product.price * (1 - discountPercent / 100);

      item.price = product.price;        // giá gốc
      item.finalPrice = finalPrice;
    }

    // Tạo đơn hàng
    // Sau khi đã xử lý tồn kho và chuẩn bị newOrder...
    const newOrder = await Order.create(
      [{
        userId,
        orderItems,
        shippingInfo,
        couponId: couponId || null,
        discountAmount: discountAmount || 0,
        totalAmount,
        paymentMethod,
        status: "Chờ xác nhận",
      }],
      { session }
    );

    // Nếu có áp mã giảm giá thì update UserVoucher ngay trong transaction
    if (couponId) {
      const updatedVoucher = await UserVoucher.findOneAndUpdate(
        { userId, discountId: couponId, used: false },
        { $set: { used: true } },
        { session, new: true }
      );

      if (!updatedVoucher) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Voucher không hợp lệ hoặc đã dùng",
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      data: newOrder[0],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Lỗi addOrder:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo đơn hàng" });
  }
};

// [PUT] /api/orders/:id
export const updateOrder = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (status) order.status = status;
    if (cancelReason) order.cancelReason = cancelReason;

    await order.save();

    res.json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("Lỗi updateOrder:", error);
    next(error);
  }
};



// [DELETE] /api/orders/:id
export const deleteOrder = async (req, res, next) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, message: "Xoá đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi deleteOrder:", error);
    next(error);
  }
};