const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    education: {
      type: String,
      required: true,
      trim: true,
    },

    collage: {
      type: String,
      required: true,
      trim: true,
    },

    interested: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    location: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      trim: false,
      default: "",
    },
    experience: {
      type: String,
      trim: false,
      default: "",
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
const WorkForce = mongoose.model("WorkForce", applicantSchema);
module.exports.WorkForce = WorkForce;
