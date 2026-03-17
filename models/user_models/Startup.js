const mongoose = require("mongoose");

const StartupSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: true,
    },
    founder: {
      type: String,
      required: true,
    },
    o_email: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports.StartupModel = mongoose.model("Startup", StartupSchema);
