const mongoose = require("mongoose");

const { Schema } = mongoose;

const CourseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 400,
    },
    CategoryID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    instructorID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Instructor",
    },
    media_files: [],
    mediaCount: {
      type: Number,
      default: 0,
      max: 20,
    },
    rating: {
      type: Number,
      default: 0, // Average rating
    },
    ratingCount: {
      type: Number,
      default: 0, // Number of ratings
    },
    courseDuration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
