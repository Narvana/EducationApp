const Instructor = require("../models/instructor");
const bcrypt = require("bcryptjs");
const generateAccessToken = require("../utils/token/generateAccessToken");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const Course = require("../models/courses");
const mongoose = require("mongoose");
const Admin = require("../models/admin");

const updateInstructor = async (req, res) => {
  const { name, email, password, contact, idProof } = req.body;
  const file = req.file;
  try {
    const instructorExists = await Instructor.findById(req.params.id);

    if (!instructorExists) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    let imageLink = instructorExists.image;
    if (file) {
      imageLink = await uploadToFirebase(file);
    }

    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { name, email, password, contact, idProof, image: imageLink },
      {
        new: true,
      }
    );

    if (!instructor) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          instructor,
          "Instructure details has been succesfully updated!"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const deleteInstructor = async (req, res) => {
  try {
    const instructorId = req.params.id;
    const instructor = await Instructor.findById(instructorId);
    const adminId = req.userID;

    const admin = await Admin.findById(adminId);
    console.log(adminId);

    if (!instructor) {
      return res.status(404).json(ApiErrors(404, "Instructor not found"));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find all courses associated with this instructor
      const courses = await Course.find({ instructorID: instructorId });

      console.log(courses);

      if (courses.length > 0) {
        // Update all courses to be assigned to admin
        await Course.updateMany(
          { instructorID: instructorId },
          {
            $set: {
              instructorID: adminId,
            },
          },
          { session }
        );
      }

      await Instructor.findByIdAndDelete(instructorId, { session });
      await session.commitTransaction();
      res
        .status(200)
        .json(ApiSuccess(200, null, "Instructor deleted successfully"));
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json(ApiErrors(500, error.message));
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const loginInstructor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Instructor.findOne({ email });

    if (!user)
      return res.status(400).json(ApiErrors(400, "Invalid credentials"));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json(ApiErrors(400, "Invalid credentials"));

    const token = await generateAccessToken(user._id);

    res.status(200).json({
      status: 1,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  deleteInstructor,
  updateInstructor,
  loginInstructor,
};
