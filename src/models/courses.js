const mongoose = require("mongoose");
const { fetchCourseDetails } = require("../middleware/CourseDetails/CourseDetails");

const { Schema } = mongoose;

const CourseSchema = new Schema({
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
    type: String,
    required: true,
  },
  categoryName: {
    type: String,
    required: false,
  },
  instructorID: {
    type: String,
    required: true,
  },
  instructorName: {
    type: String,
    required: false,
  },
  videos: [
    {
      title: { type: String, required: true, maxlength: 200 },
      url: { type: String, required: true },
      duration: { type: Number, required: false },
    },
  ],
  videosCount: {
    type: Number,
    default: 0,
    max: 20,
  },
});

// Use Middleware
CourseSchema.pre("save", fetchCourseDetails);

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
