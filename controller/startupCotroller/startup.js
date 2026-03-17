const mongoose = require("mongoose");
const { StartupModel } = require("../../models/user_models/Startup");

const getDashboardData = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({
        message: "User Id is required",
        success: false,
      });
    }
    const categories = [
      "Big Industries",
      "Macro Industries",
      "Micro Industries",
      "Education Institutes",
      "Healthcare Institutes",
      "Retailers",
      "Human Resources",
      "Startup",
      "Gov Departments",
      "Manufacturing",
    ];

    const counts = await StartupModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const cards = categories.map((title) => {
      const found = counts.find((c) => c._id === title);
      return {
        title,
        count: found ? found.count : 0,
      };
    });

    const chart = cards.map((item) => ({
      name: item.title,
      count: item.count,
    }));

    const registrations = await StartupModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: "$_id.month" },
            ],
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      cards,
      chart,
      registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

const StartupData = async (req, res) => {
  try {
    const { user_id } = req.body;

    const data = await StartupModel.find({ user_id }).sort({ createdAt: -1 });

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

module.exports = { getDashboardData, StartupData };
