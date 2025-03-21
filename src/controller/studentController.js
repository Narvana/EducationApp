const Student = require("../models/student");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../utils/token/generateAccessToken");

// Create Student

const createStudent = async (req, res) => {
  const { name, email, password, contact } = req.body;
  try {
    const studentExists = await Student.findOne({ email });
    if (studentExists) {
      return res
        .status(400)
        .json(ApiErrors(400, "Student with this email already exists."));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = new Student({
      name,
      email,
      password: hashedPassword,
      role: "student",
      contact: Number(contact),
    });

    await student.save();

    res
      .status(201)
      .json(
        ApiSuccess(
          200,
          student,
          "Student account has been created successfully"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Student Login

const studentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) {
      return res
        .status(404)
        .json(ApiErrors(404, "Student with this email doesn't exist!"));
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json(ApiErrors(400, "Invalid credentials"));
    }

    const token = await generateAccessToken(student._id);

    res.status(200).json({
      status: 1,
      token,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
      message: "Student logged in successfully",
    });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get Students

const getStudent = async (req, res) => {
  try {
    const student = await Student.find();
    res
      .status(200)
      .json(ApiSuccess(200, student, "Students fetched successfully!"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Update Student

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found!"));
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          student,
          "Student's details has been successfully updated!"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Delete Student

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found!"));
    }

    res
      .status(200)
      .json({ status: 1, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  getStudent,
  updateStudent,
  createStudent,
  studentLogin,
  deleteStudent,
};
