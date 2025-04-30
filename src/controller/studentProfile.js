const Student = require("../models/student");
const StudentProfile = require("../models/studentProfile");
const Course = require("../models/courses");
const CourseApplication = require("../models/courseApplication");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

// Create a new student profile
const createProfile = async (req, res) => {
  try {
    const { studentID, motherName, fatherName, country, idNumber, categories } =
      req.body;

    // Check if the student exists
    const student = await Student.findById(studentID);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found"));
    }

    // Check if profile already exists for this student
    const existingProfile = await StudentProfile.findOne({
      student: studentID,
    });
    if (existingProfile) {
      return res.status(400).json(ApiErrors(400, "Profile already exists"));
    }

    // Create and save the profile
    const newProfile = new StudentProfile({
      student: studentID,
      motherName,
      fatherName,
      country,
      idNumber,
      categories,
    });

    await newProfile.save();

    // 👉 Update student document to link the profile
    student.profile = newProfile._id;
    await student.save();

    // Fetch courses for each category and enroll student
    for (const categoryId of categories) {
      const courses = await Course.find({ CategoryID: categoryId });

      // Create course applications for each course in this category
      for (const course of courses) {
        const application = new CourseApplication({
          userID: studentID,
          courseID: course._id,
          status: "pending",
        });
        await application.save();
      }
    }

    res
      .status(201)
      .json(ApiSuccess(201, newProfile, "Profile created successfully"));
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update existing profile
const updateProfile = async (req, res) => {
  try {
    const updatedProfile = await StudentProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProfile) {
      return res.status(404).json(ApiErrors(404, "Student profile not found"));
    }

    res
      .status(200)
      .json(ApiSuccess(200, updatedProfile, "Profile updated successfully"));
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getProfileByStudentId = async (req, res) => {
  try {
    const { id } = req.params; // assuming student ID is passed in the route param

    const profile = await StudentProfile.findOne({
      student: id,
    })
      .populate(
        "student",
        "-password -role -createdAt -updatedAt -isApproved -__v -profile"
      )
      .populate("categories", "categoryName");

    if (!profile) {
      return res.status(404).json(ApiErrors(404, "Profile not found"));
    }

    res
      .status(200)
      .json(ApiSuccess(200, profile, "Profile fetched successfully"));
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const approveStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student)
      return res.status(404).json(ApiErrors(404, "Student not found"));

    student.isApproved = true;
    await student.save();

    res
      .status(200)
      .json(ApiSuccess(200, student, "Student approved successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getUnapprovedProfiles = async (req, res) => {
  try {
    const students = await Student.find({ isApproved: false }).populate(
      "profile"
    ); // assuming 'profile' field exists on Student
    // // Optional: Filter only those who have a profile
    const result = students.filter((student) => student.profile);

    res
      .status(200)
      .json(ApiSuccess(200, result, "student profiles fetched successfully"));
  } catch (error) {
    console.error("Error fetching unapproved profiles:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getAllProfile = async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .populate("student")
      .populate("courses", "name");
    res
      .status(200)
      .json(ApiSuccess(200, students, "Students profile fetched successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  createProfile,
  updateProfile,
  getProfileByStudentId,
  approveStudent,
  getUnapprovedProfiles,
  getAllProfile,
};
