const express = require("express");
const { studentLogin } = require("../controller/studentController");
const { getCategories } = require("../controller/categoryController");
const {
  getCoursesByCategoryID,
  getCourseById,
} = require("../controller/coursescontroller");

const {
  addRating,
  getCourseRatings,
} = require("../controller/ratingController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const { getVideosByCourseID } = require("../controller/courseVideoController");

const { homePage } = require("../controller/homeController.js");
const { enrollCourse, getCoursesbyStudentID } = require("../controller/courseEnrollment.js");
const verifyToken = require("../middleware/token/verifyToken.js");
const { addRecentlyWatched } = require("../controller/recentlyWatched.js");
const {
  createProfile,
  updateProfile,
  getProfileByStudentId,
  getAllProfile,
} = require("../controller/studentProfile.js");
const { getInstructors } = require("../controller/adminController.js");
const router = express.Router();

// Login
router.post("/login", studentLogin);

// Courses and Categories

router.get("/categories/get", getCategories);

router.get("/courses/categoryid=:id", authMiddleware, getCoursesByCategoryID);

router.get("/teachers", getInstructors);

router.get("/course", authMiddleware, verifyToken, getCourseById);

router.get("/courses/media/:courseID", getVideosByCourseID);

router.get("/mycourses", authMiddleware, verifyToken, getCoursesbyStudentID)

// Rating

router.post("/rating", authMiddleware, addRating);

router.get("/ratings", getCourseRatings);

// Homepage

router.get("/home", authMiddleware, verifyToken, homePage);

// Enrolled Courses for students
router.post("/enrolledCourses", authMiddleware, verifyToken, enrollCourse);

// Recently Watched Courses for students
router.post(
  "/recentlyWatched",
  authMiddleware,
  verifyToken,
  addRecentlyWatched
);

// Student Profile

router.post("/student-profile/create", authMiddleware, createProfile);

// Update existing student profile
router.put("/student-profile/update/:id", authMiddleware, updateProfile);

// Get profile by student ID
router.get(
  "/student-profile/:id",
  authMiddleware,
  getProfileByStudentId
);



module.exports = router;
