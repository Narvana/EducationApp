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
const router = express.Router();

// Login
router.post("/login", studentLogin);

// Courses and Categories

router.get("/categories/get", getCategories);

router.get("/courses/categoryid=:id", getCoursesByCategoryID);

router.get("/teachers", getInstructor);

router.get("/course", getCourseById);

router.get("/courses/media/:courseID", getVideosByCourseID);

// Rating

router.post("/rating", authMiddleware, addRating);

router.get("/ratings", getCourseRatings);

module.exports = router;
