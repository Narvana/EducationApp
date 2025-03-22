const Course = require("../models/courses");
const Rating = require("../models/rating");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const addRating = async (req, res) => {
  try {
    const { courseID, studentID, rating, review } = req.body;

    if (!courseID || !studentID || !rating) {
      return res
        .status(400)
        .json({ message: "Course ID, User ID, and rating are required." });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    // Check if user already rated this course
    const existingRating = await Rating.findOne({ courseID, studentID });

    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this course." });
    }

    // Create new rating
    const newRating = new Rating({ courseID, studentID, rating, review });
    await newRating.save();

    // Update course rating
    const ratings = await Rating.find({ courseID });
    const ratingCount = ratings.length;
    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount;

    await Course.findByIdAndUpdate(courseID, {
      rating: avgRating.toFixed(1),
      ratingCount,
    });

    res.status(201).json({ message: "Rating added successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

const getCourseRatings = async (req, res) => {
  try {
    const { courseID } = req.params;

    const ratings = await Rating.find({ courseID }).populate(
      "userID",
      "name email"
    );

    res
      .status(200)
      .json(ApiSuccess(200, ratings, "Ratings fetched successfully"));
  } catch (error) {
    return res.status(400).json(ApiErrors(500, error.message));
  }
};

module.exports = { addRating, getCourseRatings };
