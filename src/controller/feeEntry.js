// controllers/feeController.js
const FeeEntry = require("../models/feeStructure");
const PaymentHistory = require("../models/paymentHistory");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const mongoose = require("mongoose");

// Create fee entry
const createFeeEntry = async (req, res) => {
  try {
    const { studentId, courseId, feeAmount, dueDate } = req.body;
    const fee = new FeeEntry({ studentId, courseId, feeAmount, dueDate });
    await fee.save();
    res.status(201).json(ApiSuccess(201, fee, "Entry created successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Send manual reminder
const sendManualReminder = async (req, res) => {
  try {
    const fee = await FeeEntry.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee entry not found" });

    // simulate reminder
    console.log(`Reminder sent to student: ${fee.studentId}`);
    res.status(200).json({ message: "Reminder sent manually" });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Auto reminder (triggered via cron job or scheduled task)
const sendAutoReminders = async (req, res) => {
  try {
    const today = new Date();
    const fees = await FeeEntry.find({
      dueDate: { $lte: today },
      status: "Unpaid",
      autoReminderSent: false,
    });

    for (let fee of fees) {
      // simulate reminder
      console.log(`Auto-reminder sent to student: ${fee.studentId}`);
      fee.autoReminderSent = true;
      fee.status = "Reminder Sent";
      await fee.save();
    }

    res.status(200).json({ message: `${fees.length} auto reminders sent.` });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update status
const updateFeeStatus = async (req, res) => {
  try {
    const { status, paymentMethod, transactionId } = req.body;
    const fee = await FeeEntry.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee entry not found" });

    // Only allow changing to Paid status
    if (status === "Paid") {
      const today = new Date();
      const dueDate = new Date(fee.dueDate);

      const fiveDaysBefore = new Date(dueDate);
      fiveDaysBefore.setDate(dueDate.getDate() - 5);

      const fiveDaysAfter = new Date(dueDate);
      fiveDaysAfter.setDate(dueDate.getDate() + 5);

      if (today < fiveDaysBefore) {
        return res
          .status(400)
          .json({ message: "Cannot mark as paid outside of due window." });
      }

      // Create payment history record
      const paymentHistory = new PaymentHistory({
        studentId: fee.studentId,
        courseId: fee.courseId,
        feeAmount: fee.feeAmount,
        dueDate: fee.dueDate,
        month: fee.dueDate.toLocaleString("default", { month: "long" }),
        year: fee.dueDate.getFullYear(),
        paymentMethod: paymentMethod || "Other",
        transactionId: transactionId,
        status: "Success",
      });
      await paymentHistory.save();

      // Move dueDate to next month if within window
      const nextDue = new Date(fee.dueDate);
      nextDue.setMonth(nextDue.getMonth() + 1);
      fee.dueDate = nextDue;
      fee.status = "Paid";
      await fee.save();
      return res.status(200).json(ApiSuccess(200, fee, "Updated Successfully"));
    }

    return res
      .status(400)
      .json(ApiErrors(400, "Can only update status to Paid"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getEntries = async (req, res) => {
  try {
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    // Find all entries
    const fees = await FeeEntry.find()
      .populate("studentId", "name contact email")
      .populate("courseId", "name");

    // Update status based on due date and migrate old status values
    for (let fee of fees) {
      // Migrate old status values to new ones
      if (fee.status === "Unpaid" || fee.status === "Reminder Sent") {
        if (fee.dueDate < today) {
          fee.status = "Overdue";
        } else if (fee.dueDate <= fiveDaysFromNow && fee.dueDate >= today) {
          fee.status = "Due";
        } else {
          fee.status = "Due";
        }
        await fee.save();
      } else if (fee.status !== "Paid") {
        if (fee.dueDate < today) {
          fee.status = "Overdue";
        } else if (fee.dueDate <= fiveDaysFromNow && fee.dueDate >= today) {
          fee.status = "Due";
        } else {
          fee.status = "Due";
        }
        await fee.save();
      }
    }

    // Get payment history for all students
    const paymentHistory = await PaymentHistory.find()
      .populate("studentId", "name contact email")
      .populate("courseId", "name")
      .sort({ paymentDate: -1 });

    // Group payment history by student
    const historyByStudent = paymentHistory.reduce((acc, payment) => {
      const studentId = payment.studentId._id.toString();
      if (!acc[studentId]) {
        acc[studentId] = [];
      }
      acc[studentId].push(payment);
      return acc;
    }, {});

    // Combine current fees with payment history
    const entriesWithHistory = fees.map((fee) => {
      const studentId = fee.studentId._id.toString();
      return {
        ...fee.toObject(),
        paymentHistory: historyByStudent[studentId] || [],
      };
    });

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          entriesWithHistory,
          "Entries with payment history fetched successfully"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get payment history for a student
const getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    let query = { studentId };

    if (month && year) {
      query.month = month;
      query.year = parseInt(year);
    }

    const history = await PaymentHistory.find(query)
      .populate("studentId", "name contact email")
      .populate("courseId", "name")
      .sort({ paymentDate: -1 });

    res
      .status(200)
      .json(ApiSuccess(200, history, "Payment history fetched successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get payment summary for a student
const getPaymentSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const summary = await PaymentHistory.aggregate([
      { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: {
            month: "$month",
            year: "$year",
          },
          totalPaid: { $sum: "$feeAmount" },
          payments: { $push: "$$ROOT" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res
      .status(200)
      .json(ApiSuccess(200, summary, "Payment summary fetched successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getEntries,
  updateFeeStatus,
  createFeeEntry,
  getPaymentHistory,
  getPaymentSummary,
};
