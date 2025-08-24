import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  default: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    // Với tài khoản đăng ký bằng email/password
    password: {
      type: String,
      required: function () {
        // Nếu không có google/facebook/github thì mới yêu cầu password
        return !this.googleId && !this.facebookId && !this.githubId;
      },
    },

    phoneNumber: {
      type: String,
      required: false, // Có thể không có nếu đăng nhập bằng social
    },

    address: [
      {
        type: addressSchema,
        required: false,
      },
    ],

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },


    avatar: {
      type: String,
    },

    // OAuth fields
    googleId: {
      type: String,
    },
    facebookId: {
      type: String,
    },
    githubId: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);

export default User;