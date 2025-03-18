const mongoose = require("mongoose");
const Course = require("../models/courses");
const CourseVideo = require("../models/CoursesVideos");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

// Create a new course
const createCourse = async (req, res) => {
  const { instructorID, name, description, CategoryID } = req.body;
  const files = req.files || {};

  try {
    // Validate Instructor ID
    if (!mongoose.Types.ObjectId.isValid(instructorID)) {
      return res.status(400).json({ message: "Invalid instructor ID format." });
    }

    // Ensure instructor exists
    const instructor = await Instructor.findById(instructorID);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found!" });
    }

    // Upload thumbnail (required)
    let thumbnailURI = "";
    if (files.thumbnail?.[0]) {
      thumbnailURI = await uploadToFirebase(files.thumbnail[0]);
    } else {
      return res.status(400).json({ message: "Thumbnail image is required." });
    }

    // Create course
    const course = new Course({
      name,
      description,
      CategoryID,
      instructorID,
      thumbnail: thumbnailURI,
    });

    await course.save();
    return res
      .status(201)
      .json({ message: "Course created successfully", course });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    let courses = await Course.find()
      .populate("instructorID", "name")
      .populate("CategoryID", "name");

    // Fetch videos for each course
    const courseIDs = courses.map((course) => course._id);
    const videos = await CourseVideo.find({ courseID: { $in: courseIDs } });

    // Attach videos to their respective courses
    const coursesWithVideos = courses.map((course) => {
      return {
        ...course.toObject(),
        videos: videos.filter(
          (video) => video.courseID.toString() === course._id.toString()
        ),
      };
    });

    res
      .status(200)
      .json(
        ApiSuccess(200, coursesWithVideos, "Courses fetched successfully.")
      );
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
        .json({ success: false, message: "This course does not exist!" });
    }
    res
      .status(200)
      .json(ApiSuccess(200, course, "Course fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Update a course by ID
const updateCourse = async (req, res) => {
  try {
    const { name, description, CategoryID, instructorID, videos } = req.body;
    const files = req.files; // Get uploaded files

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ status: 0, message: "This course does not exist!" });
    }

    // 🔹 Check if thumbnail is uploaded and update it
    if (files?.thumbnail && files.thumbnail[0]) {
      course.thumbnail = await uploadToFirebase(files.thumbnail[0]); // Fix: Use [0] for single file
    }

    // 🔹 Update other course fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (CategoryID) course.CategoryID = CategoryID;
    if (instructorID) course.instructorID = instructorID;

    await course.save();

    res
      .status(200)
      .json(ApiSuccess(200, course, "Course updated successfully."));
  } catch (error) {
    console.error(error); // 🔹 Log the error for debugging
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
        .json({ status: 0, message: "This course does not exist!" });
    }
    res
      .status(200)
      .json({ status: 1, message: "Course has been deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getCourseById,
  getCourses,
  deleteCourse,
};
