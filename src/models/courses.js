const mongoose = require("mongoose");

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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Category", // Ensure Category model exists
  },
  instructorID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Instructor",
  },
  videos: [
    {
      title: { type: String, required: false, maxlength: 200, default: null },
      url: { type: String, required: false, default: null },
      duration: { type: Number, default: 0 },
    },
  ],
  videosCount: {
    type: Number,
    default: 0,
    max: 20,
  },
});

// Remove middleware if unnecessary
// CourseSchema.pre("save", fetchCourseDetails);

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
