const mongoose = require("mongoose");
const { Schema } = mongoose;

const CourseApplicationSchema = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "Approved", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CourseApplication = mongoose.model(
  "CourseApplication",
  CourseApplicationSchema
);

module.exports = CourseApplication;
