const multer = require("multer");
const path = require("path");

// Keep uploads in memory so they can be streamed to Cloudinary.
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Invalid image format. Use jpg, jpeg, png, gif, webp, heic, or heif."));
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
