const mongoose = require("mongoose");

const { Schema } = mongoose;

const CourseVideos = new Schema(
  {
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
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
      // required: function () {
      //   return this.mediaType !== "pdf";
      // },
    },
    media: {
      type: String,
      required: true,
    },
    document: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CourseVideo = mongoose.model("CourseVideos", CourseVideos);

module.exports = CourseVideo;
