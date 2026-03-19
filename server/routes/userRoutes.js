const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUserProfile,
  verifyOTP,
  resendOTP,
  googleLogin,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

router.post("/", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/google-login", googleLogin);

router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.single("image"), updateUserProfile);

module.exports = router;
