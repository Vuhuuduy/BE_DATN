import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendMail.js";
import {
  RESET_PASSWORD_SECRET,
  RESET_PASSWORD_EXPIRES,
  CLIENT_URL,
  JWT_SECRET,
} from "../configs/enviroments.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const authController = {
  register: async (req, res) => {
    const { fullname, email, password, phoneNumber, address } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        fullname,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
      });

      await newUser.save();

      res.status(201).json({ message: "Đăng ký thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

login: async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // Nếu tài khoản bị khóa -> không cho đăng nhập
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa, vui lòng liên hệ Admin",
        forceLogout: true, // FE sẽ dựa vào flag này mà redirect
        redirect: "/login?blocked=true" // FE có thể đọc redirect URL từ đây
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
},


  oauthCallback: async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(400).json({ message: "OAuth thất bại" });
    }

    const token = generateToken(user);
    res.redirect(`${CLIENT_URL}/oauth-success?token=${token}`);
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Email không tồn tại" });
      }

      const token = jwt.sign({ id: user._id }, RESET_PASSWORD_SECRET, {
        expiresIn: RESET_PASSWORD_EXPIRES,
      });

      const resetLink = `${CLIENT_URL}/reset-password/${token}`;

      await sendEmail(
        email,
        "Đặt lại mật khẩu",
        `Click vào link sau để đặt lại mật khẩu: ${resetLink}`
      );

      res.status(200).json({ message: "Link đặt lại mật khẩu đã được gửi qua email" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

resetPassword: async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, RESET_PASSWORD_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Hash mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);

    // 🔑 Chỉ validate field bị thay đổi
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({ message: "Mật khẩu đã được cập nhật" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn", error: error.message });
  }
},


updateUser: async (req, res) => {
  const { id } = req.params;
  let { fullname, phoneNumber, address, isActive } = req.body;

  // Ép kiểu sang boolean
  if (typeof isActive === "string") {
    isActive = isActive === "true";
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullname, phoneNumber, address, isActive },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Nếu tài khoản bị khóa => trả thêm flag để client biết đăng xuất
    if (isActive === false) {
      return res.json({
        message: "Cập nhật thành công - Tài khoản đã bị khóa",
        user: updatedUser,
        forceLogout: true // flag cho frontend xử lý logout
      });
    }

    res.json({ message: "Cập nhật thành công", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
},
  // ======== Đổi mật khẩu ========

changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.params.id;


      if (!userId) {
        return res.status(401).json({ message: "Token không chứa ID hợp lệ" });
      }
      if (!newPassword || !oldPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đủ mật khẩu cũ và mới" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedUser = await User.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      res.json({ message: "Xóa người dùng thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  getUserById: async (req, res) => {
    const { id } = req.params;

    try {
      const user = await User.findById(id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
};

export default authController;
