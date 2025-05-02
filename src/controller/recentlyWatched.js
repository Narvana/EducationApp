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

    return res
      .status(200)
      .json(
        ApiSuccess(
          200,
          formatted,
          "Recently watched courses retrieved successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getRecentlyWatched:", error);
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

const addRecentlyWatched = async (req, res) => {
  try {
    const userID = req.userID;
    const { mediaID, progress } = req.body;

    if (!userID || !mediaID || progress == null) {
      return res.status(400).json(ApiErrors(400, "Missing required fields"));
    }

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

    const existingCourse = await RecentCourse.findOne({ userID, mediaID });
    let progressDifference = 0;

    if (existingCourse) {
      if (progressSeconds > existingCourse.progress) {
        progressDifference = progressSeconds - existingCourse.progress;
        existingCourse.progress = progressSeconds;
        existingCourse.progressPercentage = progressPercentage;
        existingCourse.duration = totalDuration;
        await existingCourse.save();
      }
    } else {
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

    // Watch history update
    const today = moment().utc().format("YYYY-MM-DD");
    let updatedWatchHistory = null;

    if (
      progressDifference > 0 &&
      ["video", "audio"].includes(media.mediaType)
    ) {
      updatedWatchHistory = await WatchHistory.findOneAndUpdate(
        { userID, date: today },
        { $inc: { totalSecondsWatched: progressDifference } },
        { upsert: true, new: true }
      );
    }

    // Calculate streak efficiently
    const streakGoalSeconds = 3600; // 60 min
    let streak = 0;

    for (let i = 0; i < 100; i++) {
      const checkDate = moment().utc().subtract(i, "days").format("YYYY-MM-DD");
      const history = await WatchHistory.findOne({ userID, date: checkDate });

      if (history && history.totalSecondsWatched >= streakGoalSeconds) {
        streak++;
      } else {
        break;
      }
    }

    const todayWatch =
      updatedWatchHistory ||
      (await WatchHistory.findOne({
        userID,
        date: today,
      }));

    const secondsWatchedToday = todayWatch?.totalSecondsWatched || 0;
    const secondsLeft = Math.max(0, streakGoalSeconds - secondsWatchedToday);
    const streakProgress = Math.min(
      100,
      Math.round((secondsWatchedToday / streakGoalSeconds) * 100)
    );

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
    console.error("Error in addRecentlyWatched:", error);
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getRecentlyWatched,
  addRecentlyWatched,
};
