const StudentProfile = require("../models/studentProfile");
const Student = require("../models/student");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const createStudentProfile = async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      pincode,
      education,
      skills,
      interests,
      goals,
    } = req.body;

    // Get student ID from authenticated user
    const studentId = req.userID;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json(ApiErrors(404, "Student not found"));
    }

    // Check if profile already exists
    let profile = await StudentProfile.findOne({ student: studentId });

    if (profile) {
      // Update existing profile
      profile = await StudentProfile.findOneAndUpdate(
        { student: studentId },
        {
          address,
          city,
          state,
          pincode,
          education,
          skills,
          interests,
          goals,
          isApproved: false, // Reset approval status on update
        },
        { new: true, runValidators: true }
      );

      return res
        .status(200)
        .json(ApiSuccess(200, profile, "Student profile updated successfully"));
    }

    // Create new profile
    profile = new StudentProfile({
      student: studentId,
      address,
      city,
      state,
      pincode,
      education,
      skills,
      interests,
      goals,
      isApproved: false,
    });

    await profile.save();

    // Update student's isApproved status
    await Student.findByIdAndUpdate(studentId, { isApproved: false });

    return res
      .status(201)
      .json(ApiSuccess(201, profile, "Student profile created successfully"));
  } catch (error) {
    console.error("Error in createStudentProfile:", error);
    return res
      .status(500)
      .json(ApiErrors(500, "Failed to create/update student profile"));
  }
};

module.exports = {
  createStudentProfile,
};
