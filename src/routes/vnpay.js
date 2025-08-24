import { Router } from "express";
import moment from "moment";
import qs from "qs"; // ✅ dùng qs
import crypto from "crypto";
import Order from "../models/order.js";
import { sendOrderEmail } from "../utils/sendMail.js";
const vnpayRouter = Router();

const config = {
  vnp_TmnCode: "9JZBJ7GH",
  vnp_HashSecret: "8ZNURXPUOGOZWF4PNL2BILYQDJ7O2F45",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: "http://localhost:8888/api/vnpay/vnpay_return",
};

// Sort key tăng dần
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

// Build chuỗi để hash: URL-encode theo RFC1738 (giống PHP urlencode -> space thành '+')
function buildHashData(params) {
  const sorted = sortObject(params);
  return qs.stringify(sorted, { encode: true, format: "RFC1738" });
}

// Build query string cho redirect URL (cùng format để an toàn)
function buildQueryString(params) {
  return qs.stringify(params, { encode: true, format: "RFC1738" });
}

// ✅ Tạo URL thanh toán
vnpayRouter.post("/create_payment_url", async (req, res) => {
  try {
    console.log("===== [VNPay] TẠO URL THANH TOÁN =====");
    console.log("📥 Body nhận từ FE:", req.body);

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.ip ||
      "127.0.0.1";

    const {
      userId,
      orderItems,
      shippingInfo,
      totalAmount,
      couponId,
      discountAmount,
    } = req.body;

    // Lưu Order (giữ nguyên logic: status 'Chờ xác nhận')
    const newOrder = await Order.create({
      userId,
      orderItems,
      shippingInfo,
      totalAmount,
      couponId: couponId || null,
      discountAmount: discountAmount || 0,
      paymentMethod: "VNPAY",
      status: "Chờ xác nhận",
    });

    console.log("🆕 Order đã lưu DB:", newOrder._id);

    const orderId = moment().format("YYYYMMDDHHmmss");
    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderInfo = "Thanh_toan_don_hang"; // tránh dấu/ ký tự đặc biệt
    const locale = req.body.language || "vn";
    const currCode = "VND";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "billpayment",
      vnp_Amount: String(Math.round(totalAmount) * 100), // đảm bảo là chuỗi số nguyên
      vnp_ReturnUrl: `${config.vnp_ReturnUrl}?orderDbId=${newOrder._id}`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    console.log("🔹 Params gốc:", vnp_Params);

    // 1) Build chuỗi hash (đã encode theo RFC1738)
    const signData = buildHashData(vnp_Params);
    const signed = crypto
.createHmac("sha512", config.vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    // 2) Thêm chữ ký và build URL redirect (encode cùng format)
    vnp_Params.vnp_SecureHash = signed;
    const paymentUrl = `${config.vnp_Url}?${buildQueryString(vnp_Params)}`;

    console.log("📄 signData:", signData);
    console.log("🔑 Secure Hash:", signed);
    console.log("➡️ URL thanh toán:", paymentUrl);

    res.json({ paymentUrl });
  } catch (err) {
    console.error("❌ Lỗi khi tạo thanh toán VNPay:", err);
    res.status(500).json({ error: "Lỗi khi tạo thanh toán VNPay" });
  }
});

// ✅ VNPay callback
// ✅ VNPay callback (patch tối thiểu)
vnpayRouter.get("/vnpay_return", async (req, res) => {
  console.log("===== [VNPay] CALLBACK RETURN =====");
  console.log("📥 Query từ VNPay:", req.query);

  // Lấy riêng orderDbId để dùng cập nhật DB, KHÔNG đưa vào signData
  const orderDbId = req.query.orderDbId;

  // 🔒 Chỉ lấy các tham số bắt đầu bằng vnp_
  let vnp_Params = {};
  for (const k of Object.keys(req.query)) {
    if (k.startsWith("vnp_")) vnp_Params[k] = req.query[k];
  }

  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // sort A-Z
  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((acc, k) => {
      acc[k] = vnp_Params[k];
      return acc;
    }, {});

  // ❗️Build chuỗi hash y như khuyến nghị: KHÔNG encode khi ký (giống sample VNPay)
  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  console.log("📄 signData (callback):", signData);
  console.log("🔑 SecureHash nhận:", secureHash);
  console.log("🔑 SecureHash tính lại:", signed);

  try {
    if (secureHash === signed) {
      if (orderDbId) {
        // ✅ Gửi email xác nhận
        const order = await Order.findById(orderDbId);
        if (order) {
          await sendOrderEmail(
            order.shippingInfo.email, // customerEmail
            order._id, // orderId
            order.shippingInfo.fullName, // fullName
            order.totalAmount // totalAmount
          );
        }
        await Order.findByIdAndUpdate(orderDbId, {
          $set: { status: "Chờ xác nhận" },
        });
        console.log("📝 Order cập nhật trạng thái: Chờ xác nhận");
      }
      return res.redirect(
        `http://localhost:5173/checkoutsuccess?orderId=${orderDbId}&status=success`
      );
    } else {
      console.warn("⚠️ Hash không khớp, từ chối giao dịch.");
      return res.redirect(
        `http://localhost:5173/checkoutsuccess?status=failed`
      );
    }
  } catch (err) {
    console.error("❌ Lỗi xử lý callback:", err);
return res.redirect(`http://localhost:5173/checkoutsuccess?status=error`);
  }
});

export default vnpayRouter;
