const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    state: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    is_info_filled: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports.UserModel = mongoose.model("User", UserSchema);
