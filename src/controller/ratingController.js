const Course = require("../models/courses");
const Rating = require("../models/rating");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const AdminRating = require("../models/adminRating");

const addRating = async (req, res) => {
  try {
    const { courseID, studentID, rating, review } = req.body;

    if (!courseID || !studentID || !rating) {
      return res
        .status(400)
        .json({ message: "Course ID, User ID, and rating are required." });
    }

    // Convert rating to integer and validate
    const ratingInt = Math.round(Number(rating));
    if (ratingInt < 1 || ratingInt > 5) {
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

    // Create new rating with integer value
    const newRating = new Rating({
      courseID,
      studentID,
      rating: ratingInt,
      review,
    });
    await newRating.save();

    // Update course rating
    const ratings = await Rating.find({ courseID });
    const ratingCount = ratings.length;
    const avgRating = Math.round(
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    );

    await Course.findByIdAndUpdate(courseID, {
      rating: avgRating,
      ratingCount,
    });

    res.status(201).json({ message: "Rating added successfully." });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getCourseRatings = async (req, res) => {
  try {
    const { courseID } = req.query;

    const ratings = await Rating.find({ courseID }).populate(
      "studentID",
      "name"
    );

    res
      .status(200)
      .json(ApiSuccess(200, ratings, "Ratings fetched successfully"));
  } catch (error) {
    return res.status(400).json(ApiErrors(500, error.message));
  }
};

const addAdminRating = async (req, res) => {
  try {
    const adminID = req.user.id;
    const { courseID, rating, review } = req.body;

    if (!courseID || !adminID || rating === undefined) {
      return res
        .status(400)
        .json({ message: "Course ID, Admin ID, and rating are required." });
    }

    // Convert rating to integer and validate
    const ratingInt = Math.round(Number(rating));
    if (ratingInt < 1 || ratingInt > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    // Check if admin already rated this course
    const existingRating = await AdminRating.findOne({ courseID, adminID });

    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this course." });
    }

    // Create new admin rating with integer value
    const newRating = new AdminRating({
      courseID,
      adminID,
      rating: ratingInt,
      review,
    });
    await newRating.save();

    // Fetch all ratings from students and admins
    const studentRatings = await Rating.find({ courseID });
    const adminRatings = await AdminRating.find({ courseID });

    const totalRatings = [...studentRatings, ...adminRatings];
    const ratingCount = totalRatings.length;
    const avgRating = Math.round(
      totalRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    );

    // Update course with new integer average
    await Course.findByIdAndUpdate(courseID, {
      rating: avgRating,
      ratingCount,
    });

    res.status(201).json({ message: "Admin rating added successfully." });
  } catch (error) {
    console.error("Error adding admin rating:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getRatingsAll = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate("studentID", "name")
      .populate("courseID", "name");
    res
      .status(200)
      .json(ApiSuccess(200, ratings, "Ratings fetched successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const deleteRating = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRating = await Rating.findByIdAndDelete(id);
    if (!deletedRating) {
      return res.status(404).json({ message: "Rating not found." });
    }
    res
      .status(200)
      .json(ApiSuccess(200, deletedRating, "Rating deleted successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  addRating,
  getCourseRatings,
  getRatingsAll,
  deleteRating,
  addAdminRating,
};
