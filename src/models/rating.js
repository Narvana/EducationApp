const mongoose = require("mongoose");

const { Schema } = mongoose;

const RatingSchema = new Schema(
  {
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    studentID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "student",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", RatingSchema);

module.exports = Rating;
