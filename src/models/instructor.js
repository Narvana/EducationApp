const mongoose = require("mongoose");
const { Schema } = mongoose;

const instructorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["instructor"],
      default: "instructor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Instructor = mongoose.model("instructor", instructorSchema);

module.exports = Instructor;
