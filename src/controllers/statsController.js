import Product from "../models/Product.js";
import Order from "../models/order.js";

export const getStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Đếm đơn hàng chưa xác nhận
        const pendingOrders = await Order.countDocuments({ status: "Chờ xác nhận" });

        // Tính tổng doanh thu từ tất cả đơn đã thanh toán
        const revenueData = await Order.aggregate([
            { $match: { status: "Đã hoàn thành" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);


        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.json({
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//top 10 sản phẩm bán chạy 



export const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.productId",
          totalSold: { $sum: "$orderItems.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      // Chỉ lấy sản phẩm còn stock >0
      { $match: { "product.stock": { $gt: 0 } } },
      {
        $project: {
          productId: "$product._id",
          name: "$product.name",
          price: "$product.price",
          stock: "$product.stock",
          imageUrl: "$product.imageUrl",
          totalSold: 1,
        },
      },
    ]);

    res.json(topProducts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
