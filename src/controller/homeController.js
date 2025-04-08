const Category = require("../models/category");
const Course = require("../models/courses");
const RecentCourse = require("../models/recentCourse");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const homePage = async (req, res) => {
  try {
    const userID = req.userID;

    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(6);
    const topCourses = await Course.find().sort({ rating: -1 }).limit(6);
    const categories = await Category.find();

    let recentlyWatched = [];

    if (userID) {
      const recentWatchedDocs = await RecentCourse.find({ userID })
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate("mediaID"); // assumes mediaID references a CourseVideo or Course

      recentlyWatched = recentWatchedDocs.map((item) => {
        const media = item.mediaID;
        return {
          mediaID: media._id,
          title: media.title,
          media: media.media,
          progress: item.progress,
          mediaType: media.mediaType,
          duration: media.duration,
        };
      });
    }

    const responseData = {
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
      recentlyWatched, // included here
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
