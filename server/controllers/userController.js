const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  cloudinary,
  uploadBufferToCloudinary,
} = require("../services/cloudinary");

// Generate JWT
// Generate access JWT
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Password validation regex
// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Please add all fields" });
    return;
  }

  // Validate password strength
  if (!PASSWORD_REGEX.test(password)) {
    res.status(400).json({
      message:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
    });
    return;
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpires,
    isVerified: false,
  });

  if (user) {
    // Send OTP Email
    try {
      const { sendEmail } = require("../services/emailService");
      const emailSent = await sendEmail(
        user.email,
        "Productivity App - Verify your account",
        `Your Verification Code is: ${otp}`,
      );

      if (!emailSent) {
        console.warn("OTP email may not have been sent successfully");
      }

      // In development provide the OTP in the response to help debugging
      const responseBody = {
        message: "Registration successful. Please check your email for OTP.",
        email: user.email,
      };
      if (process.env.NODE_ENV !== "production") {
        responseBody.otp = otp; // debug only
      }

      res.status(201).json(responseBody);
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Still return success so user can try to verify
      res.status(201).json({
        message: "Registration successful. Please check your email for OTP.",
        email: user.email,
      });
    }
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  if (user.otp === otp && user.otpExpires > Date.now()) {
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate token
    const accessToken = generateAccessToken(user._id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: accessToken,
    });
  } else {
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    if (!user.isVerified) {
      res.status(400).json({ message: "Please verify your email first" });
      return;
    }

    // generate token
    const accessToken = generateAccessToken(user._id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: accessToken,
    });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
};

// @desc    Google Login
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "Server config error" });
  }

  const { OAuth2Client } = require("google-auth-library");
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
      }
      if (user.picturePublicId) {
        try {
          await cloudinary.uploader.destroy(user.picturePublicId);
        } catch (error) {
          console.warn(
            "Failed to delete previous Cloudinary image:",
            error.message,
          );
        }
        user.picturePublicId = "";
      }
      // Always update picture if it comes from Google
      if (picture) {
        user.picture = picture;
      }
      await user.save();
    } else {
      // Create new user (password is dummy/random for google users)
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        googleId,
        picture,
        isVerified: true, // Google users are verified by default
      });
    }

    // generate token
    const accessToken = generateAccessToken(user._id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: accessToken,
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(400).json({ message: error.message || "Google Login Failed" });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  res.json({ message: "Logged out" });
};

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "User already verified" });
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP Email
  try {
    const { sendEmail } = require("../services/emailService");
    const emailSent = await sendEmail(
      user.email,
      "Productivity App - Verify your account (Resend)",
      `Your Verification Code is: ${otp}`,
    );

    const responseBody = {
      message: emailSent
        ? "OTP resent successfully"
        : "OTP generated but email delivery may have failed. Please check spam folder.",
      email: user.email,
    };
    if (process.env.NODE_ENV !== "production") responseBody.otp = otp;

    res.json(responseBody);
  } catch (error) {
    console.error("Error resending OTP:", error);
    const responseBody = {
      message: "OTP generated but email delivery failed. Please try again.",
      email: user.email,
    };
    if (process.env.NODE_ENV !== "production") responseBody.otp = otp;
    res.json(responseBody);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      // Validate password strength
      if (!PASSWORD_REGEX.test(req.body.password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    if (req.file) {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          message: "Cloudinary is not configured on server",
        });
      }

      if (!req.file.buffer) {
        return res.status(400).json({ message: "Invalid image upload" });
      }

      if (user.picturePublicId) {
        try {
          await cloudinary.uploader.destroy(user.picturePublicId);
        } catch (error) {
          console.warn(
            "Failed to delete previous Cloudinary image:",
            error.message,
          );
        }
      }

      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        folder: process.env.CLOUDINARY_FOLDER || "productivity-hub/profiles",
        resource_type: "image",
      });

      user.picture = uploadResult.secure_url;
      user.picturePublicId = uploadResult.public_id;
    }

    const updatedUser = await user.save();
    const accessToken = generateAccessToken(updatedUser._id);

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      picture: updatedUser.picture,
      token: accessToken,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to update profile. Please try again." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUserProfile,
  verifyOTP,
  resendOTP,
  googleLogin,
};
