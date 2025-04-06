const Instructor = require("../models/instructor");
const Student = require("../models/student");
const Course = require("../models/courses");
const Category = require("../models/category");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");


const getDashboardData = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalInstructors = await Instructor.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalCategories = await Category.countDocuments();

    res.status(200).json(
      ApiSuccess(200, {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalCategories,
      })
    );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
}

module.exports = {
  getDashboardData,
};