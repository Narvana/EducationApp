const Category = require("../models/category");
const Course = require("../models/courses");
const RecentCourse = require("../models/recentCourse");
const Banner = require("../models/banner");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const calculateStreak = require("../utils/Streak/streakandprogress");

const homePage = async (req, res) => {
  try {
    const userID = req.userID;

    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(6);
    const topCourses = await Course.find().sort({ rating: -1 }).limit(6);
    const categories = await Category.find();
    const banners = await Banner.find();
    let recentlyWatched = [];
    let streakData = null;

    if (userID) {
      streakData = await calculateStreak(userID);
      const recentWatchedDocs = await RecentCourse.find({
        userID,
        progressPercentage: { $lt: 100 },
      })
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate("mediaID");

      recentlyWatched = recentWatchedDocs.map((item) => {
        const media = item.mediaID;
        return {
          mediaID: media._id,
          title: media.title,
          media: media.media,
          progress: item.progress,
          progressPercentage: item.progressPercentage,
          mediaType: media.mediaType,
          duration: item.duration,
        };
      });
    }

    const responseData = {
      banners: banners.map((banner) => ({
        _id: banner._id,
        image: banner.image,
      })),
      recentCourses: recentCourses.map((course) => ({
        _id: course._id,
        name: course.name,
        thumbnail: course.thumbnail,
        description: course.description,
        CategoryID: course.CategoryID,
        instructorID: course.instructorID,
        mediaCount: course.mediaCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        createdAt: course.createdAt,
      })),
      topCourses: topCourses.map((course) => ({
        _id: course._id,
        name: course.name,
        thumbnail: course.thumbnail,
        description: course.description,
        CategoryID: course.CategoryID,
        instructorID: course.instructorID,
        mediaCount: course.mediaCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        createdAt: course.createdAt,
      })),
      categories: categories.map((category) => ({
        _id: category._id,
        categoryName: category.categoryName,
        image: category.image,
      })),
      recentlyWatched,
      streak: streakData || {
        streak: 0,
        todayProgress: 0,
        secondsLeft: 3600,
        secondsWatchedToday: 0,
      },
    };

    res
      .status(200)
      .json(
        ApiSuccess(200, responseData, "Home page content fetched successfully.")
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = { homePage };
