const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentHistorySchema = new Schema(
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
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Other"],
      required: true,
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "Pending"],
      default: "Success",
    },
  },
  { timestamps: true }
);

const PaymentHistory = mongoose.model("PaymentHistory", paymentHistorySchema);

module.exports = PaymentHistory;
