const Course = require("../models/courses");
const CourseVideo = require("../models/CoursesVideos");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

// Get all courses for an instructor
const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.userID;

    if (!instructorId) {
      return res.status(401).json(ApiErrors(401, "Unauthorized access"));
    }

    // Find all courses where the instructor is assigned
    const courses = await Course.find({ instructorID: instructorId }).populate(
      "CategoryID",
      "categoryName"
    );

    const courseIDs = courses.map((course) => course._id);
    const videos = await CourseVideo.find({ courseID: { $in: courseIDs } });

    const totalDuration = (course) =>
      videos
        .filter((video) => video.courseID.toString() === course._id.toString())
        .map((v) => v.duration)
        .reduce((a, b) => a + b, 0);

    const filteredVideos = (course) =>
      videos.filter(
        (video) => video.courseID.toString() === course._id.toString()
      );

    const coursesWithVideos = courses.map((course) => {
      return {
        ...course.toObject(),
        mediaCount: filteredVideos(course).length,
        totalDuration: totalDuration(course),
        media_files: filteredVideos(course),
      };
    });
    return res
      .status(200)
      .json(
        ApiSuccess(
          200,
          coursesWithVideos,
          "Instructor courses fetched successfully"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get course details with enrolled students

module.exports = {
  getInstructorCourses,
};
