// models/StudentProfile.js

const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student", // Link to Student schema
      required: true,
    },
    motherName: { type: String },
    fatherName: { type: String },
    country: { type: String },
    idNumber: { type: String },
    courses: [
      {type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ]
  },
  { timestamps: true }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;
