const RecentCourse = require("../models/recentCourse");
const Student = require("../models/student");
const CourseVideo = require("../models/CoursesVideos");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const getRecentlyWatched = async (req, res) => {
  try {
    const { studentID } = req.params; // Assuming you get the student ID from the request parameters

    // Find the student by ID
    const student = await Student.findById(studentID);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found!"));
    }

    // Find recently watched courses for the student
    const recentCourses = await RecentCourse.find({ studentID }).populate(
      "courseID"
    );

    if (!recentCourses || recentCourses.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "No recently watched courses found!"));
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          recentCourses,
          "Recently watched courses retrieved successfully!"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const addRecentlyWatched = async (req, res) => {
  try {
    const userID = req.userID; // from token
    const { mediaID, progress } = req.body;

    const student = await Student.findById(userID);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found!"));
    }

    const existingCourse = await RecentCourse.findOne({
      userID,
      mediaID,
    });
    if (existingCourse) {
      existingCourse.progress = progress; // Update progress if already exists
      await existingCourse.save();
      res
        .status(200)
        .json(
          ApiSuccess(200, existingCourse, "Progress updated successfully!")
        );
    } else {
      const newRecentCourse = new RecentCourse({
        userID,
        mediaID,
        progress,
      });

      await newRecentCourse.save();

      res
        .status(201)
        .json(
          ApiSuccess(
            201,
            newRecentCourse,
            "Course added to recently watched list!"
          )
        );
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getRecentlyWatched,
  addRecentlyWatched,
};
