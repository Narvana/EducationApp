const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "instructor",
      // required: true,
    },

    classDay: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    schedule: {
      type: [String],
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate attendance records
attendanceSchema.index(
  { studentId: 1, courseId: 1, date: 1 },
  { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
