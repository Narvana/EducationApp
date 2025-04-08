const express = require("express");
const { studentLogin } = require("../controller/studentController");
const { getCategories } = require("../controller/categoryController");
const {
  getCoursesByCategoryID,
  getCourseById,
} = require("../controller/coursescontroller");
const { getInstructor } = require("../controller/instructorController");
const {
  addRating,
  getCourseRatings,
} = require("../controller/ratingController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const { getVideosByCourseID } = require("../controller/courseVideoController");

const { homePage } = require("../controller/homeController.js");
const { enrollCourse } = require("../controller/courseEnrollment.js");
const verifyToken = require("../middleware/token/verifyToken.js");
const { addRecentlyWatched } = require("../controller/recentlyWatched.js");
const router = express.Router();

// Login
router.post("/login", studentLogin);

// Courses and Categories

router.get("/categories/get", getCategories);

router.get("/courses/categoryid=:id", authMiddleware, getCoursesByCategoryID);

router.get("/teachers", getInstructor);

router.get("/course", getCourseById);

router.get("/courses/media/:courseID", getVideosByCourseID);

// Rating

router.post("/rating", authMiddleware, addRating);

router.get("/ratings", getCourseRatings);

// Homepage

router.get("/home", authMiddleware, verifyToken, homePage);

// Enrolled Courses for students
router.post("/enrolledCourses", authMiddleware, enrollCourse);

// Recently Watched Courses for students
router.post(
  "/recentlyWatched",
  authMiddleware,
  verifyToken,
  addRecentlyWatched
);

module.exports = router;
