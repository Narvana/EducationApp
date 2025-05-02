const Category = require("../models/category");
const Course = require("../models/courses");
const RecentCourse = require("../models/recentCourse");
const Banner = require("../models/banner");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const calculateStreak = require("../utils/Streak/streakandprogress");
const Student = require("../models/student");
const CourseApplication = require("../models/courseApplication");

const homePage = async (req, res) => {
  try {
    const userID = req.userID;

    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(6);
    const topCourses = await Course.find().sort({ rating: -1 }).limit(6);
    const categories = await Category.find();
    const banners = await Banner.find();
    let recentlyWatched = [];
    let streakData = null;
    let formattedCourses = [];

    if (userID) {
      // Get approved course applications
      const suggestedCourses = await CourseApplication.find({
        userID,
        status: "Approved",
      }).populate({
        path: "courseID",
        populate: {
          path: "CategoryID",
          select: "categoryName",
        },
      });

      // Filter out any null courseIDs and format the courses
      formattedCourses = suggestedCourses
        .filter((app) => app.courseID) // Filter out null courseIDs
        .map((app) => ({
          ...app.courseID.toObject(),
          isEnrolled: true,
          enrollmentStatus: "Approved",
        }));

      streakData = await calculateStreak(userID);

      const recentWatchedDocs = await RecentCourse.find({
        userID,
      })
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate({
          path: "mediaID",
          populate: {
            path: "courseID",
            select: "name thumbnail",
          },
        });

      recentlyWatched = recentWatchedDocs
        .map((item) => {
          const media = item.mediaID;
          if (!media) return null;

          return {
            mediaID: media._id,
            title: media.title,
            media: media.media,
            progress: item.progress,
            progressPercentage: item.progressPercentage,
            mediaType: media.mediaType,
            duration: item.duration,
            courseName: media.courseName || "Unknown Course",
            courseThumbnail: media.courseID?.thumbnail || null,
          };
        })
        .filter(Boolean);
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
        rating: Math.round(course.rating),
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
        rating: Math.round(course.rating),
        ratingCount: course.ratingCount,
        createdAt: course.createdAt,
      })),
      suggestedCourses: formattedCourses.map((course) => ({
        _id: course._id,
        name: course.name,
        thumbnail: course.thumbnail,
        description: course.description,
        CategoryID: course.CategoryID,
        instructorID: course.instructorID,
        mediaCount: course.mediaCount,
        rating: Math.round(course.rating),
        ratingCount: course.ratingCount,
        createdAt: course.createdAt,
        isEnrolled: course.isEnrolled,
        enrollmentStatus: course.enrollmentStatus,
      })),
      categories: categories.map((category) => ({
        _id: category._id,
        categoryName: category.categoryName,
        image: category.image,
      })),
      recentlyWatched,
      streak: streakData
        ? {
            streak: streakData.streak,
            todayProgress: streakData.minutesWatchedToday,
            minutesLeft: streakData.minutesLeft,
            minutesWatchedToday: streakData.minutesWatchedToday,
            streakProgress: streakData.streakProgress,
          }
        : {
            streak: 0,
            todayProgress: 0,
            minutesLeft: 60,
            minutesWatchedToday: 0,
            streakProgress: 0,
          },
    };

    res
      .status(200)
      .json(
        ApiSuccess(200, responseData, "Home page content fetched successfully.")
      );
  } catch (error) {
    console.error("Error in homePage:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = { homePage };
