import Cart from "../models/cart.js";

// Lấy giỏ hàng
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Thêm sản phẩm
export const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const item = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });

    // Kiểm tra trùng (id + color + size)
    const existingItem = cart.items.find(
      i => i._id === item._id && i.color === item.color && i.size === item.size
    );

    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      cart.items.push(item);
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa 1 sản phẩm
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, color, size } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      i => !(i._id === id && i.color === color && i.size === size)
    );

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật số lượng
export const updateQuantity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, color, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const existingItem = cart.items.find(
      i => i._id === id && i.color === color && i.size === size
    );
    if (existingItem) existingItem.quantity = quantity;

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
