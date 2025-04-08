const mongoose = require("mongoose");
const { Schema } = mongoose;
const RecentCourseSchema = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
    },
    mediaID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseVideos",
      required: true,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Number, // in seconds or milliseconds
      default: 0,
    },
  },
  { timestamps: true }
);

const RecentCourse = mongoose.model("RecentCourse", RecentCourseSchema);
module.exports = RecentCourse;
