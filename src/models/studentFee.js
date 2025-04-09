const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Bank Transfer"],
    required: true,
  },
});

const studentFeeSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    totalFee: {
      type: Number,
      required: true,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      required: true,
    },
    paymentHistory: [paymentSchema],
  },
  { timestamps: true }
);

const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
module.exports = StudentFee;
