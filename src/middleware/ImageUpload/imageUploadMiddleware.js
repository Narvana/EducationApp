const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") || // Accept images (jpeg, png, gif, etc.)
    file.mimetype.startsWith("video/") || // Accept videos (mp4, avi, mov, etc.)
    file.mimetype === "application/pdf" // Accept PDF files
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF), videos (MP4, AVI, MOV), and PDFs are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 50, // Limit file size to 20MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
