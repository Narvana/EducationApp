const mongoose = require("mongoose");
const { Schema } = mongoose;

const InstructorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,
      required: true,
      unique: true,
      trim: true,
    },
    idProof: {
      type: String, // Can be a file URL or document number
      required: true,
    },
    role: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("Instructor", InstructorSchema);
module.exports = User;
