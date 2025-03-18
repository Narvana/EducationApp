const mongoose = require("mongoose");

const { Schema } = mongoose;

const CourseVideos = new Schema(
  {
    courseID: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CourseVideo = mongoose.model("CourseVideos", CourseVideos);

module.exports = CourseVideo;
