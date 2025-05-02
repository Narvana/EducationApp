const express = require("express");
const router = express.Router();
const { loginInstructor } = require("../controller/instructorController");
const {
  getInstructorCourses,
} = require("../controller/instructorCoursesController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const verifyToken = require("../middleware/token/verifyToken");


// Auth routes
router.post("/login", loginInstructor);

// Course management
router.get("/courses", authMiddleware, verifyToken, getInstructorCourses);

module.exports = router;
