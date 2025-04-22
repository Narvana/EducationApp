// models/FeeEntry.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const feeEntrySchema = new Schema(
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
    feeAmount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Due", "Overdue"],
      default: "Due",
    },
    // autoReminderSent: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  { timestamps: true }
);

const FeeEntry = mongoose.model("FeeEntry", feeEntrySchema);

module.exports = FeeEntry;
