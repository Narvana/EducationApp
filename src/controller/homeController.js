const Category = require("../models/category");
const Course = require("../models/courses");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const homePage = async (req, res) => {
  try {
    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(6);

    const topCourses = await Course.find().sort({ rating: -1 }).limit(6);

    const categories = await Category.find();

    const responseData = {
      recentCourses: recentCourses.map((course) => {
        const {
          _id,
          name,
          thumbnail,
          description,
          CategoryID,
          instructorID,
          mediaCount,
          rating,
          ratingCount,
          createdAt,
        } = course;
        return {
          _id,
          name,
          thumbnail,
          description,
          CategoryID,
          instructorID,
          mediaCount,
          rating,
          ratingCount,
          createdAt,
        };
      }),
      topCourses: topCourses.map((course) => {
        const {
          _id,
          name,
          thumbnail,
          description,
          CategoryID,
          instructorID,
          mediaCount,
          rating,
          ratingCount,
          createdAt,
        } = course;
        return {
          _id,
          name,
          thumbnail,
          description,
          CategoryID,
          instructorID,
          mediaCount,
          rating,
          ratingCount,
          createdAt,
        };
      }),
      categories: categories.map((category) => {
        const { _id, categoryName, image } = category;
        return { _id, categoryName, image };
      }),
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
