const mongoose = require("mongoose");
const { WorkForce } = require("../../models/user_models/HRModel");

const WorkForceData = async (req, res) => {
  try {
    const { user_id } = req.body;

    const data = await WorkForce.find({ user_id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { WorkForceData };
