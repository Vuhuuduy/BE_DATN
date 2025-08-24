  import mongoose from "mongoose";

  const cartItemSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // id sản phẩm
    name: String,
    price: Number,
    image: String,
    color: String,
    size: String,
    quantity: { type: Number, default: 1 }
  });

  const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [cartItemSchema]
  }, { timestamps: true });

  export default mongoose.model("Cart", cartSchema);
