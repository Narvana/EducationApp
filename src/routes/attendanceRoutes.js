const express = require("express");
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  getCourseAttendance,
  updateAttendance,
  getAttendanceStats,
} = require("../controller/attendanceController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const { verify } = require("jsonwebtoken");
const verifyToken = require("../middleware/token/verifyToken");

// Routes for marking attendance (both instructor and admin)
router.post("/mark", authMiddleware, markAttendance);
router.post("/mark-bulk", authMiddleware, markBulkAttendance);

// Routes for getting attendance records
router.get("/student", authMiddleware,verifyToken, getStudentAttendance);
router.get("/course", authMiddleware, getCourseAttendance);

// Route for updating attendance (both instructor and admin)
router.put("/:id", authMiddleware, updateAttendance);

// Route for getting attendance statistics
router.get("/stats", authMiddleware, getAttendanceStats);

module.exports = router;
