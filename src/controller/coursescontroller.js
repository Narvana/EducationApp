const Course = require("../models/courses");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

// Create a new course
const createCourse = async (req, res) => {
  const { instructorID } = req.body;
  try {
    const course = new Course(req.body);
    const instructor = await Instructor.findById({ _id: instructorID });

    if (!instructor) {
      return res.status(404).json({
        status: 0,
        message: "Instructor not found!",
      });
    }
    await course.save();

    res
      .status(201)
      .json(ApiSuccess(201, course, "Course created successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    let courses = await Course.find();

    res
      .status(200)
      .json(ApiSuccess(200, courses, "Courses fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res
      .status(200)
      .json(ApiSuccess(200, course, "Course fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Courses by category id

const byCategoryId = async (req, res) => {
  try {
    const courses = await Course.findById(req.params.id);
  } catch (error) {}
};

// Update a course by ID
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res.status(404).json({ status: 0, message: "Course not found" });
    }
    res
      .status(200)
      .json(ApiSuccess(200, course, "Course updated successfully."));
  } catch (error) {
    res.status(400).json({ status: 0, message: error.message });
  }
};

// Delete a course by ID
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getCourseById,
  getCourses,
  deleteCourse,
};
