const Student = require("../models/student");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../utils/token/generateAccessToken");
const validatePassword = require("../utils/passwordValidation");
const StudentProfile = require("../models/studentProfile");
const Course = require("../models/courses");
const CourseApplication = require("../models/courseApplication");
const Attendance = require("../models/attendance");
const WatchHistory = require("../models/watchHistory");
const RecentCourse = require("../models/recentCourse");
const mongoose = require("mongoose");
const FeeEntry = require("../models/feeStructure");
const PaymentHistory = require("../models/paymentHistory");

// Create Student

const createStudent = async (req, res) => {
  const { name, email, password, contact } = req.body;
  try {
    // Validate password
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json(
          ApiErrors(
            400,
            "Password must be 8-15 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          )
        );
    }

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
          201,
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

    const hasProfile = await StudentProfile.findOne({ student: student._id });

    let approved = false;

    if (hasProfile) {
      approved = true;
    } else {
      approved = false;
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
        isApproved: approved,
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
    const studentId = req.params.id;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find all course applications for this student
      const courseApplications = await CourseApplication.find({
        userID: studentId,
      });
      const courseIds = courseApplications.map((app) => app.courseID);

      // Delete all watch history for this student
      await WatchHistory.deleteMany({ userID: studentId }, { session });

      // Delete all recent courses for this student
      await RecentCourse.deleteMany({ userID: studentId }, { session });

      // Delete all attendance records for this student
      await Attendance.deleteMany({ studentID: studentId }, { session });

      // Delete all course applications for this student
      await CourseApplication.deleteMany({ userID: studentId }, { session });

      await FeeEntry.deleteMany({ studentId }, { session });

      await PaymentHistory.deleteMany({ studentId }, { session });

      // Delete student profile
      await StudentProfile.deleteOne({ student: studentId }, { session });

      // Finally delete the student
      const deletedStudent = await Student.findByIdAndDelete(studentId, {
        session,
      });

      if (!deletedStudent) {
        await session.abortTransaction();
        return res.status(404).json(ApiErrors(404, "Student not found!"));
      }

      // If everything is successful, commit the transaction
      await session.commitTransaction();

      res
        .status(200)
        .json(
          ApiSuccess(
            200,
            null,
            "Student and all associated data deleted successfully!"
          )
        );
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error("Error in deleteStudent:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getEnrolledStudentsInstructor = async (req, res) => {
  try {
    const teacherId = req.userID;
    const { courseId, search } = req.query;

    // Find all courses taught by the teacher
    const courseQuery = { teacherId };
    if (courseId) {
      courseQuery._id = courseId;
    }
    const courses = await Course.find(courseQuery);

    if (!courses.length) {
      return res
        .status(404)
        .json(ApiErrors(404, "No courses found for this teacher"));
    }

    // Find all approved course applications for these courses
    const applications = await CourseApplication.find({
      courseID: { $in: courses.map((course) => course._id) },
      status: { $regex: new RegExp("^approved$", "i") },
    })
      .populate({
        path: "userID",
        select: "name contact email role isApproved profile createdAt",
        populate: {
          path: "profile",
          select: "motherName fatherName country idNumber categories",
        },
      })
      .populate("courseID", "name description");

    // Group applications by student ID
    const studentMap = new Map();

    applications.forEach((app) => {
      const studentId = app.userID._id.toString();

      if (!studentMap.has(studentId)) {
        // First time seeing this student
        studentMap.set(studentId, {
          studentId: app.userID._id,
          name: app.userID.name,
          contact: app.userID.contact,
          email: app.userID.email,
          role: app.userID.role,
          isApproved: app.userID.isApproved,
          profile: app.userID.profile
            ? {
                motherName: app.userID.profile.motherName,
                fatherName: app.userID.profile.fatherName,
                country: app.userID.profile.country,
                idNumber: app.userID.profile.idNumber,
                categories: app.userID.profile.categories,
              }
            : null,
          studentSince: app.userID.createdAt,
          enrolledCourses: [],
        });
      }

      // Add course to student's enrolled courses
      studentMap.get(studentId).enrolledCourses.push({
        courseId: app.courseID._id,
        courseName: app.courseID.name,
        description: app.courseID.description,
        enrollmentDate: app.createdAt,
        status: app.status,
      });
    });

    // Convert Map to array
    const enrolledStudents = Array.from(studentMap.values());

    // Apply search filter if provided
    let filteredStudents = enrolledStudents;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStudents = enrolledStudents.filter(
        (student) =>
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.contact.toString().includes(searchLower) ||
          student.enrolledCourses.some((course) =>
            course.courseName.toLowerCase().includes(searchLower)
          )
      );
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          filteredStudents,
          "Enrolled students retrieved successfully"
        )
      );
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
  getEnrolledStudentsInstructor,
};
