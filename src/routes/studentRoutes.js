const express = require("express");
const { studentLogin } = require("../controller/studentController");
const { getCategories } = require("../controller/categoryController");
const { getCoursesByCategoryID } = require("../controller/coursescontroller");
const { getInstructor } = require("../controller/instructorController");
const {
  addRating,
  getCourseRatings,
} = require("../controller/ratingController");
const { authMiddleware } = require("../middleware/Admin/authMiddleware");
const router = express.Router();

// Login
router.post("/login", studentLogin);

router.get("/categories/get", getCategories);

router.get("/courses/categoryid=:id", getCoursesByCategoryID);

router.get("/teachers", getInstructor);

// Rating

router.post("/rating", authMiddleware, addRating);

router.get("/ratings/:courseID", getCourseRatings);

module.exports = router;
