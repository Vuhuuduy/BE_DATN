import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Get all categories (optionally filter by status)
export const getAllCategories = async (req, res, next) => {
  try {
    const { status } = req.query; // ?status=active
    const filter = status ? { status } : {};

    const categories = await Category.find(filter);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách danh mục thành công",
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Get only active categories
export const getActiveCategories = async (req, res, next) => {
  try {
    const activeCategories = await Category.find({ status: 'active' });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách danh mục đang hoạt động thành công",
      data: activeCategories
    });
  } catch (error) {
    next(error);
  }
};

// Get category by ID
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục"
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết danh mục thành công",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Add new category
export const addCategory = async (req, res, next) => {
  try {
    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục đã tồn tại"
      });
    }

    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Danh mục đã được thêm thành công",
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

// Update category
export const updateCategory = async (req, res, next) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục"
      });
    }

    res.status(200).json({
      success: true,
      message: "Danh mục đã được cập nhật thành công",
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

// Delete category with product check
export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check if any products use this category
    const productsUsingCategory = await Product.find({ category: categoryId });

    if (productsUsingCategory.length > 0) {
      // Soft delete: set status to inactive
      const inactiveCategory = await Category.findByIdAndUpdate(
        categoryId,
        { status: "inactive" },
        { new: true }
      );

      if (!inactiveCategory) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Danh mục có sản phẩm nên đã chuyển sang trạng thái inactive",
        data: inactiveCategory
      });
    }

    // Hard delete
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục"
      });
    }

    res.status(200).json({
      success: true,
      message: "Danh mục đã được xóa khỏi hệ thống",
      data: deletedCategory
    });
  } catch (error) {
    next(error);
  }
};



export const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: category._id }).populate("category");

    res.status(200).json({
      success: true,
      message: "Lấy sản phẩm theo danh mục thành công",
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


