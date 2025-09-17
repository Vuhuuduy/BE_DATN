import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Variant from "../models/variant.js"; // thêm vào đây
import mongoose from "mongoose";

// Lấy tất cả sản phẩm
import Comment from "../models/comment.js";

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category", "name status");

    const productsWithRating = await Promise.all(
      products.map(async (prod) => {
        const comments = await Comment.find({ productId: prod._id });
        const totalReviews = comments.length;
        const avgRating =
          totalReviews > 0
            ? comments.reduce((sum, c) => sum + c.rating, 0) / totalReviews
            : 0;

        return {
          ...prod.toObject(),
          rating: avgRating,
          reviews: totalReviews,
        };
      })
    );

    res.json({ success: true, data: productsWithRating });
  } catch (error) {
    next(error);
  }
};


// Lấy sản phẩm theo ID (có kèm variants)
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name image status")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    // Lấy variants liên kết với productId này
    const variants = await Variant.find({ productId: product._id }).lean();

    res.json({ 
      success: true, 
      data: { 
        ...product, 
        variants // gộp variants vào response
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy sản phẩm theo slug của category
export const getProductsByCategorySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục"
      });
    }

    const products = await Product.find({ category: category._id });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Thêm sản phẩm mới
export const addProduct = async (req, res, next) => {
  try {
     console.log("Received body:", req.body); // 🟢 log dữ liệu từ FE gửi lên
    const { name, price, description, category, imageUrl, stock,  variants } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Tên, giá và danh mục sản phẩm là bắt buộc"
      });
    }

    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.status(400).json({
        success: false,
        message: "Danh mục không tồn tại"
      });
    }

    if (foundCategory.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Danh mục đã bị khóa, không thể thêm sản phẩm"
      });
    }

    const newProduct = new Product({
      name,
      price,
      description,
      category,
      imageUrl,
       stock, 
       variants 
 
    });

    await newProduct.save();

    // Nếu có mảng variants gửi kèm, thì tạo mới trong bảng Variant
    if (Array.isArray(variants) && variants.length > 0) {
      const variantDocs = variants.map(v => ({
        ...v,
        productId: newProduct._id
      }));
      await Variant.insertMany(variantDocs);
    }

    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: newProduct
    });
  } catch (error) {
      console.error("Error while adding product:", error); // 🟢 log lỗi chi tiết
    next(error);
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res, next) => {
  try {
    const { category, stock } = req.body;

    // Check danh mục
    if (category) {
      const foundCategory = await Category.findById(category);
      if (!foundCategory) {
        return res.status(400).json({
          success: false,
          message: "Danh mục không tồn tại",
        });
      }
      if (foundCategory.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Danh mục đã bị khóa, không thể cập nhật sản phẩm vào danh mục này",
        });
      }
    }

    // Check id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    
   

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("category", "name status");

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Xoá sản phẩm
export const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    // Xóa luôn các variants thuộc sản phẩm này
    await Variant.deleteMany({ productId: deletedProduct._id });

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công"
    });
  } catch (error) {
    next(error);
  }
};
