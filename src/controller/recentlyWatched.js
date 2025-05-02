const RecentCourse = require("../models/recentCourse");
const Student = require("../models/student");
const CourseVideo = require("../models/CoursesVideos");
const moment = require("moment");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const WatchHistory = require("../models/watchHistory");

const getRecentlyWatched = async (req, res) => {
  try {
    const { studentID } = req.params;
    const student = await Student.findById(studentID);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found!"));
    }

    // Find recently watched courses for the student
    const recentCourses = await RecentCourse.find({
      userID: studentID,
      progressPercentage: { $lt: 100 },
    }).populate("mediaID");

    if (!recentCourses || recentCourses.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "No recently watched courses found!"));
    }

    const formatted = recentCourses.map((item) => ({
      mediaID: item.mediaID._id,
      title: item.mediaID.title,
      media: item.mediaID.media,
      mediaType: item.mediaID.mediaType,
      progress: item.progress,
      progressPercentage: item.progressPercentage,
      duration: item.duration,
    }));

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          formatted,
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
    const userID = req.userID;
    const { mediaID, progress } = req.body;

    const student = await Student.findById(userID);
    if (!student)
      return res.status(404).json(ApiErrors(404, "Student not found!"));

    const media = await CourseVideo.findById(mediaID);
    if (!media) return res.status(404).json(ApiErrors(404, "Media not found!"));

    const totalDuration = media.duration || 1;
    let progressSeconds = Number(progress);
    let progressPercentage = 0;

    if (media.mediaType === "pdf") {
      progressSeconds = 0;
      progressPercentage = 100;
    } else {
      progressPercentage = Math.min(
        100,
        Math.round((progressSeconds / totalDuration) * 100)
      );
    }

    if (progressSeconds > totalDuration) {
      return res
        .status(400)
        .json(ApiErrors(400, "Progress cannot exceed total duration!"));
    }

    // Find existing recent course
    const existingCourse = await RecentCourse.findOne({ userID, mediaID });
    let progressDifference = 0;

    if (existingCourse) {
      // Calculate progress difference only if new progress is greater
      if (progressSeconds > existingCourse.progress) {
        progressDifference = progressSeconds - existingCourse.progress;
        existingCourse.progress = progressSeconds;
        existingCourse.progressPercentage = progressPercentage;
        await existingCourse.save();
      }
    } else {
      // For new entries, use the full progress as difference
      progressDifference = progressSeconds;
      const newRecentCourse = new RecentCourse({
        userID,
        mediaID,
        progress: progressSeconds,
        progressPercentage,
        duration: totalDuration,
      });
      await newRecentCourse.save();
    }

    // Update watch history only if there's actual progress
    if (
      progressDifference > 0 &&
      (media.mediaType === "video" || media.mediaType === "audio")
    ) {
      const today = moment().format("YYYY-MM-DD");
      await WatchHistory.findOneAndUpdate(
        { userID, date: today },
        { $inc: { totalSecondsWatched: progressDifference } },
        { upsert: true, new: true }
      );
    }

    // Calculate streak
    const streakGoalSeconds = 60 * 60; // 60 minutes = 3600 seconds
    const today = moment();
    let streak = 0;

    for (let i = 0; i < 100; i++) {
      const date = today.clone().subtract(i, "days").format("YYYY-MM-DD");
      const dayWatch = await WatchHistory.findOne({ userID, date });

      if (dayWatch && dayWatch.totalSecondsWatched >= streakGoalSeconds) {
        streak++;
      } else {
        break;
      }
    }

    const todayWatch = await WatchHistory.findOne({
      userID,
      date: today.format("YYYY-MM-DD"),
    });

    const secondsWatchedToday = todayWatch?.totalSecondsWatched || 0;
    const streakProgress = Math.min(
      100,
      Math.round((secondsWatchedToday / streakGoalSeconds) * 100)
    );
    const secondsLeft = Math.max(0, streakGoalSeconds - secondsWatchedToday);

    return res.status(200).json(
      ApiSuccess(
        200,
        {
          streak,
          secondsWatchedToday,
          secondsLeft,
          streakProgress,
        },
        "Progress updated successfully!"
      )
    );
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getRecentlyWatched,
  addRecentlyWatched,
};
