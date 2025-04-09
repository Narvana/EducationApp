const StudentFee = require("../models/studentFee");

// Create a new student fee record
const createStudentFee = async (req, res) => {
  try {
    const { studentName, courseName, totalFee } = req.body;
    const student = new StudentFee({
      studentName,
      courseName,
      totalFee,
      totalPaid: 0,
      pendingAmount: totalFee,
      paymentHistory: [],
    });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a payment
const addPayment = async (req, res) => {
  try {
    const { paymentDate, amountPaid, paymentMethod } = req.body;
    const student = await StudentFee.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.totalPaid += amountPaid;
    student.pendingAmount = student.totalFee - student.totalPaid;

    student.paymentHistory.push({ paymentDate, amountPaid, paymentMethod });
    await student.save();

    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all student fee records
const getAllStudents = async (req, res) => {
  try {
    const students = await StudentFee.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await StudentFee.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createStudentFee,
  addPayment,
  getAllStudents,
  getStudentById,
};
