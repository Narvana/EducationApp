const express = require("express");
const router = express.Router();
const { loginInstructor } = require("../controller/instructorController");
const {
  getInstructorCourses,
} = require("../controller/instructorCoursesController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const verifyToken = require("../middleware/token/verifyToken");
const {
  createCourse,
  updateCourse,
} = require("../controller/coursescontroller");
const upload = require("../middleware/ImageUpload/imageUploadMiddleware");
const {
  createVideo,
  updateVideo,
  deleteVideo,
  getVideosByCourseID,
} = require("../controller/courseVideoController");
const {
  markAttendance,
  getStudentAttendanceByTeacherId,
} = require("../controller/attendanceController");

const { getEnrolledStudentsInstructor } = require("../controller/studentController");

// Auth routes
router.post("/login", loginInstructor);

// Course management
router.get("/courses", authMiddleware, verifyToken, getInstructorCourses);

router.post(
  "/courses/create",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Single file // Multiple files
    { name: "media", maxCount: 1 }, // Single file // Multiple files
  ]),
  verifyToken,
  createCourse
);

router.put(
  "/courses/update/:id",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Single file
  ]),
  verifyToken,
  updateCourse
);

router.post(
  "/courses/videos/add",
  authMiddleware,
  upload.fields([
    { name: "media", maxCount: 1 }, // Single file // Multiple files
    { name: "document", maxCount: 1 }, // Single file // Multiple files
  ]),
  createVideo
);

router.put(
  "/courses/videos/update/:id",
  authMiddleware,
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  updateVideo
);

router.delete("/courses/videos/delete/:id", authMiddleware, deleteVideo);

router.get("/courses/videos/:courseID", authMiddleware, getVideosByCourseID);

// Attendance routes

router.post("/attendance/mark", authMiddleware, verifyToken, markAttendance);

router.get(
  "/attendance/student",
  authMiddleware,
  verifyToken,
  getStudentAttendanceByTeacherId
);

// Get all enrolled students for teacher's courses


// Add the route
router.get("/enrolled-students", getEnrolledStudentsInstructor);

module.exports = router;
