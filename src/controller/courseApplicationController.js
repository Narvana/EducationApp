const CourseApplication = require("../models/courseApplication");
const Course = require("../models/courses");

const applyForCourse = async (req, res) => {
  const { courseID } = req.body;
  const userID = req.user.id; // Extract from logged-in user token

  try {
    // Check if the user already applied
    const existingApplication = await CourseApplication.findOne({
      userID,
      courseID,
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this course." });
    }

    // Save new application
    const newApplication = new CourseApplication({ userID, courseID });
    await newApplication.save();

    return res
      .status(201)
      .json({ message: "Application submitted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPendingApplications = async (req, res) => {
  try {
    const applications = await CourseApplication.find({ status: "pending" })
      .populate("userID", "name email") // Fetch user details
      .populate("courseID", "name"); // Fetch course details

    return res.status(200).json({ applications });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { applicationID } = req.params;
  const { status } = req.body;

  if (!["approved", "declined"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use 'approved' or 'declined'." });
  }

  try {
    const application = await CourseApplication.findById(applicationID);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    application.status = status;
    await application.save();

    return res
      .status(200)
      .json({ message: `Application ${status} successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateApplicationStatus,
  applyForCourse,
  getPendingApplications,
};
