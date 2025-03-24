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
    mediaType: {
      type: String,
      enum: ["video", "audio", "pdf"],
      required: true,
    },
    duration: {
      type: Number,
      required: function () {
        return this.mediaType !== "pdf"; // Required only if not a PDF
      },
    },
    media: {
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
