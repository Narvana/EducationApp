const RecentCourse = require("../models/recentCourse");
const Student = require("../models/student");
const CourseVideo = require("../models/CoursesVideos");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const getRecentlyWatched = async (req, res) => {
  try {
    const { studentID } = req.params; 
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

    const media = await CourseVideo.findById(mediaID);
    if (!media) {
      return res.status(404).json(ApiErrors(404, "Media not found!"));
    }

    let totalDuration = media.duration;
    let progressSeconds = Number(progress);
    let progressPercentage = 0;

    if (media.mediaType === "pdf") {
      progressSeconds = 0;
      progressPercentage = 100;
    } else {
      const totalDuration = media.duration; 
      progressPercentage = Math.min(
        100,
        Math.round((progressSeconds / totalDuration) * 100)
      );
    }

    const existingCourse = await RecentCourse.findOne({ userID, mediaID });

    if (existingCourse) {
      existingCourse.progress = progressSeconds;
      existingCourse.progressPercentage = progressPercentage;
      await existingCourse.save();
      return res
        .status(200)
        .json(
          ApiSuccess(200, existingCourse, "Progress updated successfully!")
        );
    } else {
      const newRecentCourse = new RecentCourse({
        userID,
        mediaID,
        progress: progressSeconds,
        progressPercentage,
        duration: totalDuration,
      });

      await newRecentCourse.save();

      return res
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
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getRecentlyWatched,
  addRecentlyWatched,
};
