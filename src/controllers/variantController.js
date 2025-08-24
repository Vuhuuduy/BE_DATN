import Variant from "../models/variant.js";

// Get all variants
export const getAllVariants = async (req, res, next) => {
  try {
    const variants = await Variant.find().populate('productId', 'name');
    res.status(200).json({
      success: true,
      data: variants
    });
  } catch (error) {
    next(error);
  }
};


// Get variants by Product ID
export const getVariantsByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const variants = await Variant.find({ productId }).populate('productId', 'name');

    if (!variants || variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy biến thể cho sản phẩm này"
      });
    }

    res.status(200).json({
      success: true,
      data: variants
    });
  } catch (error) {
    next(error);
  }
};


// Add variant
export const addVariant = async (req, res, next) => {
  try {
    const { productId, sku, color, size, price, stock_quantity, image_URL } = req.body;

    const newVariant = new Variant({
      productId,
      sku,
      color,
      size,
      price,
      stock_quantity,
      image_URL,
    });

    await newVariant.save();

    res.status(201).json({
      success: true,
      data: newVariant
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Update variant
export const updateVariant = async (req, res, next) => {
  try {
    const updatedVariant = await Variant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('productId', 'name');

    if (!updatedVariant) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy biến thể"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedVariant
    });

  } catch (error) {
    next(error);
  }
};

// Delete variant
export const deleteVariant = async (req, res, next) => {
  try {
    const deletedVariant = await Variant.findByIdAndDelete(req.params.id);
    if (!deletedVariant) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy biến thể"
      });
    }
    res.status(200).json({
      success: true,
      message: "Biến thể đã được xóa thành công"
    });
  } catch (error) {
    next(error);
  }
};
