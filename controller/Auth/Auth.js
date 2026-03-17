const { UserModel } = require("../../models/user_models/user");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

exports.SignUp = async (req, res) => {
  try {
    console.log("$$$ req body", req.body);
    console.log("$$$ req file", req?.file);
    const { name, email, in_password, state, district } = req.body;
    const profileImage = req.file ? req.file?.path : null;
    if (!name || !email || !in_password || !state || !district) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    if (in_password.trim().length < 6) {
      return res.status(400).json({
        message: "Password's length should be grater then 6 character",
        success: false,
      });
    }
    const checkExistingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });
    if (checkExistingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
        success: false,
      });
    }

    const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 15;

    const hashed_password = await bcrypt.hash(in_password, SALT_ROUNDS);
    const user = new UserModel({
      email: email.toLowerCase(),
      password: hashed_password,
      state,
      name,
      district,
      profileImage,
    });

    await user.save();
    console.log("✔️ User data saved");

    const token = await JWT.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const { password, ...userData } = user.toObject();

    return res.status(201).json({
      message: "Account created successfully",
      success: true,
      token: token,
      user_data: userData,
    });
  } catch (error) {
    console.error("Something went wrong ❌", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error,
    });
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, in_password } = req.body;

    if (!email || !in_password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email",
        success: false,
      });
    }
    console.log("$$$ user", user);
    if (user.is_deleted) {
      return res.status(401).json({
        message: "User profile is deleted",
        success: false,
      });
    }
    if (!user.isVerified) {
      return res.status(401).json({
        message: "User profile is not yet verified !",
        success: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(in_password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    const token = JWT.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const { password, ...userData } = user.toObject();

    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user_data: userData,
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
