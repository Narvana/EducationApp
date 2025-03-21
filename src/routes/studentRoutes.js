const express = require("express");
const { studentLogin } = require("../controller/studentController");
const { getCategories } = require("../controller/categoryController");
const { getCoursesByCategoryID } = require("../controller/coursescontroller");
const { getInstructor } = require("../controller/instructorController");
const router = express.Router();

// Login
router.post("/login", studentLogin);

router.get("/categories/get", getCategories);

router.get("/courses/categoryid=:id", getCoursesByCategoryID);

router.get("/teachers", getInstructor);

module.exports = router;
