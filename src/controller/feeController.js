const Course = require("../models/courses");
const StudentFee = require("../models/studentFee");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

// Create a new student fee record
const createStudentFee = async (req, res) => {
  try {
    const { studentID, courseID, totalFee } = req.body;
    const studentExists = await StudentFee.findOne({ studentID, courseID });
    if (studentExists) {
      return res.status(400).json({
        message:
          "Student fee record already exists for this student and course",
      });
    }

    const student = new StudentFee({
      studentID,
      courseID,
      totalFee,
      totalPaid: 0,
      pendingAmount: totalFee,
      paymentHistory: [],
    });
    await student.save();
    res
      .status(201)
      .json(
        ApiSuccess(201, student, "Student fee record created successfully")
      );
  } catch (err) {
    res.status(500).json(ApiErrors(500, err.message));
  }
};

// Add a payment
const addPayment = async (req, res) => {
  try {
    const { paymentDate, amountPaid, paymentMethod } = req.body;
    const student = await StudentFee.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Convert to number to avoid type issues
    const paidAmount = Number(amountPaid);
    if (student.totalFee === student.totalPaid) {
     return res.status(400).json(ApiErrors(400, "Fee already fully paid"));
    }

    student.totalPaid += paidAmount;
    student.pendingAmount = student.totalFee - student.totalPaid;
    if (student.totalFee === student.totalPaid) {
      student.status = "Paid";
    }

    student.paymentHistory.push({
      paymentDate,
      amountPaid: paidAmount,
      paymentMethod,
    });
    await student.save();

    const isFullyPaid = student.pendingAmount <= 0;

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          student,
          isFullyPaid
            ? "Student has fully paid the fee."
            : "Payment recorded successfully."
        )
      );
  } catch (err) {
    res.status(500).json(ApiErrors(500, err.message));
  }
};

// Get all student fee records
const getAllStudents = async (req, res) => {
  try {
    const students = await StudentFee.find().populate("studentID", "name contact email").populate("courseID", "name");
    res
      .status(200)
      .json(ApiSuccess(200, students, "Students retrieved successfully"));
  } catch (err) {
    res.status(500).json(ApiErrors(500, err.message));
  }
};

// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await StudentFee.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res
      .status(200)
      .json(ApiSuccess(200, student, "Student retrieved successfully"));
  } catch (err) {
    res.status(500).json(ApiErrors(500, err.message));
  }
};

module.exports = {
  createStudentFee,
  addPayment,
  getAllStudents,
  getStudentById,
};
