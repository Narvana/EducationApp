const Admin = require("../models/admin");
const Instructor = require("../models/instructor");
const Course = require("../models/courses");
const Student = require("../models/courseApplication");
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
  const { name, email, password, contact, idProof, occupation } = req.body;

  const file = req.file;

  console.log(file, "Received image");

  try {
    let instructorExists = await Instructor.findOne({ email });
    if (instructorExists)
      return res.status(400).json(ApiErrors(400, "Instructor already exists"));

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(file);

    let teacherImage = "";
    if (file) {
      teacherImage = await uploadToFirebase(file);
      console.log(teacherImage);
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
      occupation,
      image: teacherImage,
    });

    await instructor.save();
    return res
      .status(201)
      .json(ApiSuccess(201, instructor, "Instructor created successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

const getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find();

    const instructorWithCourses = await Promise.all(
      instructors.map(async (instructor) => {
        const courses = await Course.find({ instructorID: instructor._id });

        // Gather all student counts for each course
        let studentcount = 0;

        await Promise.all(
          courses.map(async (course) => {
            const students = await Student.find({ courseID: course._id });
            studentcount += students.length;
          })
        );

        return {
          ...instructor.toObject(),
          courseCount: courses.length,
          studentcount, // ✅ Total students in all courses by this instructor
        };
      })
    );

    return res
      .status(200)
      .json(
        ApiSuccess(
          200,
          instructorWithCourses,
          "Instructors fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error fetching instructors:", error);
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

// Check for token validation
const verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ msg: "Invalid token" });
  }
};

module.exports = {
  registerSuperAdmin,
  createInstructor,
  loginAdmin,
  getInstructors,
};
