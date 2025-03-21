const Admin = require("../models/admin");
const Instructor = require("../models/instructor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../utils/token/generateAccessToken");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

// Register Super Admin (Only for first-time setup)
const registerSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let adminExists = await Admin.findOne({ email });
    if (adminExists)
      return res.status(400).json({ msg: "Admin already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    await superAdmin.save();
    res.status(201).json({ msg: "Super Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Super Admin Creates Instructor
const createInstructor = async (req, res) => {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res
      .status(403)
      .json({ msg: "Access Denied! Only Super Admin can create instructors." });
  }

  const { name, email, password, contact, idProof } = req.body;

  const file = req.file;

  try {
    let instructorExists = await Instructor.findOne({ email });
    if (instructorExists)
      return res.status(400).json({ msg: "Instructor already exists" });

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let teacherImage = "";
    if (file.image) {
      teacherImage = await uploadToFirebase(file.image[0]);
    } else {
      return res
        .status(400)
        .json(ApiErrors(400, "Teacher's image is required"));
    }

    const instructor = new Instructor({
      name,
      email,
      password: hashedPassword,
      role: "instructor", // Corrected to match defined roles
      contact: Number(contact),
      idProof,
      image: teacherImage,
    });

    await instructor.save();
    return res.status(201).json({ msg: "Instructor created successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find();
    res
      .status(200)
      .json(ApiSuccess(200, instructors, "Instructors fetched successfully!"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Admin.findOne({ email });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = await generateAccessToken(user._id);

    res.status(200).json({
      status: 1,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  registerSuperAdmin,
  createInstructor,
  loginAdmin,
  getInstructors,
};
