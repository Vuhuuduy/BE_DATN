  import mongoose from "mongoose";

  const variantSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    additionalPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
  });

  const productSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // ref tới model Category
        required: true,
      },
      imageUrl: {
        type: String,
      },
      stock: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["Sẵn", "Hết"],
        default: "Sẵn",
      },
      variants: {
        type: [variantSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

  const Product = mongoose.model("Product", productSchema);
  export default Product;
