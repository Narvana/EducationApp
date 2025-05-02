const CourseApplication = require("../models/courseApplication");

const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const enrollCourse = async (req, res) => {
  //Enroll a student in a course
  const { courseID } = req.body;
  const userID = req.user.id;
  try {
    const applicationExists = await CourseApplication.findOne({
      userID,
      courseID,
    });
    if (applicationExists) {
      return res
        .status(400)
        .json(ApiErrors(400, "You have already applied for this course."));
    }

    const application = new CourseApplication({
      userID,
      courseID,
    });

    await application.save();

    res
      .status(201)
      .json(ApiSuccess(200, application, "Course enrollment request sent."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const application = await CourseApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!application) {
      return res.status(404).json(ApiErrors(404, "Application not found."));
    }

    res
      .status(200)
      .json(
        ApiSuccess(200, application, "Enrollment status updated successfully.")
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getPendingApplications = async (req, res) => {
  try {
    const applications = await CourseApplication.find({ status: "pending" })
      .populate("userID", "name email") // Fetch user details
      .populate("courseID", "name"); // Fetch course details;
    if (!applications) {
      return res.status(404).json(ApiErrors(404, "No pending applications."));
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          applications,
          "Pending applications fetched successfully."
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await CourseApplication.find()
      .populate("userID", "name email") // Fetch user details
      .populate("courseID", "name"); // Fetch course details;
    if (!applications) {
      return res.status(404).json(ApiErrors(404, "No applications found."));
    }

    res
      .status(200)
      .json(
        ApiSuccess(200, applications, "All applications fetched successfully.")
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};
const deleteApplication = async (req, res) => {
  const { applicationID } = req.params;
  try {
    const application = await CourseApplication.findByIdAndDelete(
      applicationID
    );
    if (!application) {
      return res.status(404).json(ApiErrors(404, "Application not found."));
    }

    res
      .status(200)
      .json(ApiSuccess(200, null, "Application deleted successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getCoursesbyStudentID = async (req, res) => {
  try {
    const id = req.user.id;
    const courses = await CourseApplication.find({
      userID: id,
      status: "Approved",
    }).populate({
      path: "courseID",
      populate: {
        path: "CategoryID",
        select: "categoryName",
      },
    });

    if (!courses || courses.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "This student is not enrolled in any courses."));
    }

    // Transform the data to include isEnrolled and other necessary fields
    const formattedCourses = courses
      .filter((course) => course.courseID) // Filter out any null courseIDs
      .map((course) => ({
        ...course.courseID.toObject(),
        isEnrolled: true,
        enrollmentStatus: "Approved",
      }));

    if (formattedCourses.length === 0) {
      return res
        .status(200)
        .json(
          ApiSuccess(200, [], "This student is not enrolled in any courses.")
        );
    }

    res
      .status(200)
      .json(ApiSuccess(200, formattedCourses, "Courses fetched successfully"));
  } catch (error) {
    console.error("Error in getCoursesbyStudentID:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  enrollCourse,
  updateEnrollmentStatus,
  getPendingApplications,
  getAllApplications,
  deleteApplication,
  getCoursesbyStudentID,
};
