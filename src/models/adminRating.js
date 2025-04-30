const mongoose = require("mongoose");

const { Schema } = mongoose;

const AdminRatingSchema = new Schema(
  {
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    review: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const AdminRating = mongoose.model("AdminRating", AdminRatingSchema);

module.exports = AdminRating;
