// controllers/searchController.js
import Product from "../models/Product.js";

export const searchProducts = async (req, res) => {
  try {
    const { keyword, category, price, rating } = req.query;

    let filter = {
      stock: { $gt: 0 },   // còn hàng
      status: "Sẵn",       // trạng thái
    };

    // --- keyword ---
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    // --- category (theo ObjectId) ---
    if (category) {
      const categories = category.split(","); // có thể nhiều
      filter.category = { $in: categories };
    }

    // --- price ---
    if (price) {
      const ranges = price.split(",").map((r) => r.split("-").map(Number));
      filter.$or = ranges.map(([min, max]) => ({
        price: { $gte: min, $lte: max },
      }));
    }

    // --- rating ---
    if (rating) {
      // ví dụ rating=4,3 => min = 3 => lấy >= 3 sao
      const ratings = rating.split(",").map(Number);
      filter.rating = { $gte: Math.min(...ratings) };
    }

    const products = await Product.find(filter).populate("category", "name");

    res.json({
      success: true,
      total: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};
