const Attendance = require("../models/attendance");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const Student = require("../models/student");
const CourseApplication = require("../models/courseApplication");
const Admin = require("../models/admin");
const mongoose = require("mongoose");
const Course = require("../models/courses");

// Helper function to get class day
const getClassDay = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

// Validate if the current day is in the schedule
const validateSchedule = (currentDay, schedule) => {
  if (!schedule.includes(currentDay)) {
    throw new Error(
      `Attendance can only be marked on scheduled days: ${schedule.join(", ")}`
    );
  }
};

// Validate student enrollment
const validateEnrollment = async (studentId, courseId) => {
  const enrollment = await CourseApplication.findOne({
    userID: studentId,
    courseID: courseId,
    status: "Approved",
  });
  if (!enrollment) {
    throw new Error("Student is not enrolled in this course");
  }
  return enrollment;
};

// Validate time format
const validateTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    throw new Error("Invalid time format. Use HH:mm format");
  }
};

// Mark attendance for a single student
const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, schedule, attendanceDate } = req.body;
    let markedBy = null;
    const userID = req.userID;

    const instructor = await Instructor.findById(userID);

    if (instructor) {
      markedBy = instructor.name;
    } else {
      markedBy = "Admin";
    }

    // Validate future dates
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    if (date > new Date()) {
      return res
        .status(400)
        .json(ApiErrors(400, "Cannot mark attendance for future dates"));
    }

    const classDay = getClassDay(date);

    // Check if attendance already exists for this course on this date
    const existingAttendance = await Attendance.findOne({
      courseId,
      studentId,
    });

    // Only validate schedule if this is the first attendance record for the course on this date
    if (!existingAttendance) {
      if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        return res
          .status(400)
          .json(
            ApiErrors(400, "Schedule must be provided with at least one day")
          );
      }
      validateSchedule(classDay, schedule);
    }

    // Validate enrollment
    await validateEnrollment(studentId, courseId);

    const attendance = new Attendance({
      studentId,
      courseId,
      status,
      markedBy,
      date,
      classDay,
      schedule: existingAttendance ? existingAttendance.schedule : schedule,
    });

    await attendance.save();
    res
      .status(201)
      .json(ApiSuccess(201, attendance, "Attendance marked successfully"));
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json(
          ApiErrors(
            400,
            "Attendance already marked for this student on this date"
          )
        );
    }
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Mark attendance for multiple students
const markBulkAttendance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      courseId,
      attendanceList,
      schedule,
      startTime,
      endTime,
      attendanceDate,
    } = req.body;
    const markedBy = req.user.id;

    // Validate future dates
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    if (date > new Date()) {
      return res
        .status(400)
        .json(ApiErrors(400, "Cannot mark attendance for future dates"));
    }

    const classDay = getClassDay(date);

    // Check if attendance already exists for this course on this date
    const existingAttendance = await Attendance.findOne({
      courseId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    });

    // Only validate schedule if this is the first attendance record for the course on this date
    if (!existingAttendance) {
      if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        return res
          .status(400)
          .json(
            ApiErrors(400, "Schedule must be provided with at least one day")
          );
      }
      validateSchedule(classDay, schedule);
    }

    // Validate time format
    validateTimeFormat(startTime);
    validateTimeFormat(endTime);

    // Validate instructor
    await validateInstructor(markedBy, courseId);

    // Validate all students are enrolled
    const studentIds = attendanceList.map((record) => record.studentId);
    const enrollments = await CourseApplication.find({
      userID: { $in: studentIds },
      courseID: courseId,
      status: "Approved",
    });

    if (enrollments.length !== studentIds.length) {
      throw new Error("Some students are not enrolled in this course");
    }

    const attendanceRecords = attendanceList.map((record) => ({
      studentId: record.studentId,
      courseId,
      status: record.status,
      markedBy,
      date,
      classDay,
      schedule: existingAttendance ? existingAttendance.schedule : schedule,
    }));

    const savedRecords = await Attendance.insertMany(attendanceRecords, {
      session,
      ordered: false,
    });

    await session.commitTransaction();
    res
      .status(201)
      .json(
        ApiSuccess(201, savedRecords, "Bulk attendance marked successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      return res
        .status(400)
        .json(ApiErrors(400, "Some attendance records already exist"));
    }
    res.status(500).json(ApiErrors(500, error.message));
  } finally {
    session.endSession();
  }
};

// Get attendance for a student
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.query;
    const query = {};

    // If no studentId is provided, show all students with current date's attendance
    if (!studentId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all students
      const allStudents = await Student.find().select("_id name").lean();

      // Get enrolled courses for each student
      const studentEnrollments = await CourseApplication.find({
        userID: { $in: allStudents.map((s) => s._id) },
        status: { $regex: new RegExp("^approved$", "i") },
      }).populate({
        path: "courseID",
        select: "_id name",
        model: "Course",
      });

      // Get today's attendance
      const existingAttendance = await Attendance.find({
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
        .populate("studentId", "name")
        .populate("courseId", "name")
        // .populate("markedBy", "name email role")
        .lean();

      // Create a map of existing attendance
      const attendanceMap = new Map();
      existingAttendance.forEach((att) => {
        const key = `${att.studentId._id.toString()}-${
          att.courseId?._id.toString() || "no-course"
        }`;
        attendanceMap.set(key, att);
      });

      // Create a map of student enrollments
      const enrollmentMap = new Map();
      studentEnrollments.forEach((enrollment) => {
        const studentId = enrollment.userID.toString();
        if (!enrollmentMap.has(studentId)) {
          enrollmentMap.set(studentId, []);
        }
        if (enrollment.courseID) {
          enrollmentMap.get(studentId).push(enrollment.courseID);
        }
      });

      // Get the current user (admin/instructor) who is viewing the attendance
      console.log(req.user.id);

      let currentUser = await Instructor.findOne({ _id: req.user.id });

      console.log("Current USer", currentUser);

      if (!currentUser) {
        currentUser = await Admin.findOne(req.user.id).select("email").lean();
      }

      // If still no user found, use a default admin
      if (!currentUser) {
        currentUser = {
          _id: "000000000000000000000000", // Default admin ID
          name: "System Admin",
          email: "admin@system.com",
        };
      }

      // Combine existing attendance with default absent status for students without attendance
      const combinedAttendance = [];
      allStudents.forEach((student) => {
        const studentId = student._id.toString();
        const enrolledCourses = enrollmentMap.get(studentId) || [];

        if (enrolledCourses.length === 0) {
          // If student is not enrolled in any course, create a single entry
          const existingRecord = attendanceMap.get(`${studentId}-no-course`);
          if (existingRecord) {
            combinedAttendance.push(existingRecord);
          } else {
            combinedAttendance.push({
              studentId: student,
              status: "Absent",
              date: today,
              courseId: null,
              markedBy: req.user.id,
              classDay: getClassDay(today),
            });
          }
        } else {
          // Create entries for each enrolled course
          enrolledCourses.forEach((course) => {
            if (!course || !course._id) return; // Skip if course is invalid

            const existingRecord = attendanceMap.get(
              `${studentId}-${course._id}`
            );
            if (existingRecord) {
              combinedAttendance.push(existingRecord);
            } else {
              combinedAttendance.push({
                studentId: student,
                status: "Absent",
                date: today,
                courseId: course,
                markedBy: currentUser,
                classDay: getClassDay(today),
              });
            }
          });
        }
      });

      return res
        .status(200)
        .json(
          ApiSuccess(
            200,
            combinedAttendance,
            "Attendance records fetched successfully"
          )
        );
    }

    // If studentId is provided, get their enrolled courses first
    const enrolledCourses = await CourseApplication.find({
      userID: studentId,
      status: { $regex: new RegExp("^approved$", "i") },
    }).populate({
      path: "courseID",
      select: "_id name",
      model: "Course",
    });

    if (enrolledCourses.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "Student is not enrolled in any courses"));
    }

    // Get attendance for each enrolled course
    const courseIds = enrolledCourses
      .filter((enrollment) => enrollment.courseID && enrollment.courseID._id)
      .map((enrollment) => enrollment.courseID._id);

    if (courseIds.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "No valid courses found for student"));
    }

    query.studentId = studentId;
    query.courseId = { $in: courseIds };

    const attendance = await Attendance.find(query)
      .populate("courseId", "name")
      .populate("markedBy", "name email role")
      .populate("studentId", "name")
      .sort({ date: -1 });

    res
      .status(200)
      .json(
        ApiSuccess(200, attendance, "Attendance records fetched successfully")
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getStudentAttendanceByTeacherId = async (req, res) => {
  try {
    const { studentId } = req.query;
    const userID = req.userID;
    const query = {};

    // If no studentId is provided, show all students with current date's attendance
    if (!studentId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get courses taught by this instructor
      const instructorCourses = await Course.find({
        instructorID: userID,
      }).select("_id name");

      if (!instructorCourses.length) {
        return res
          .status(404)
          .json(ApiErrors(404, "No courses found for this instructor"));
      }

      const courseIds = instructorCourses.map((course) => course._id);

      // Get enrolled students for these courses
      const studentEnrollments = await CourseApplication.find({
        courseID: { $in: courseIds },
        status: { $regex: new RegExp("^approved$", "i") },
      }).populate({
        path: "userID",
        select: "_id name",
        model: "student",
      });

     

      if (!studentEnrollments.length) {
        return res
          .status(404)
          .json(ApiErrors(404, "No students enrolled in your courses"));
      }

      // Get today's attendance for these courses
      const existingAttendance = await Attendance.find({
        courseId: { $in: courseIds },
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
        .populate("studentId", "name")
        .populate("courseId", "name")
        .lean();

      // Create a map of existing attendance
      const attendanceMap = new Map();
      existingAttendance.forEach((att) => {
        const key = `${att.studentId._id.toString()}-${att.courseId._id.toString()}`;
        attendanceMap.set(key, att);
      });

      // Get the current instructor
      const currentInstructor = await Instructor.findById(userID);
      if (!currentInstructor) {
        return res.status(404).json(ApiErrors(404, "Instructor not found"));
      }

      // Combine existing attendance with default absent status for students without attendance
      const combinedAttendance = [];
      studentEnrollments.forEach((enrollment) => {
        const student = enrollment.userID;
        const course = instructorCourses.find(
          (c) => c._id.toString() === enrollment.courseID.toString()
        );

        if (!course) return;

        const key = `${student._id.toString()}-${course._id.toString()}`;
        const existingRecord = attendanceMap.get(key);

        if (existingRecord) {
          combinedAttendance.push(existingRecord);
        } else {
          combinedAttendance.push({
            studentId: student,
            courseId: course,
            status: status,
            date: today,
            markedBy: currentInstructor,
            classDay: getClassDay(today),
          });
        }
      });

      return res
        .status(200)
        .json(
          ApiSuccess(
            200,
            combinedAttendance,
            "Attendance records fetched successfully"
          )
        );
    }

    // If studentId is provided, get their enrolled courses for this instructor
    const instructorCourses = await Course.find({
      instructorID: userID,
    }).select("_id name");

    if (!instructorCourses.length) {
      return res
        .status(404)
        .json(ApiErrors(404, "No courses found for this instructor"));
    }

    const courseIds = instructorCourses.map((course) => course._id);

    // Get student's enrollments in instructor's courses
    const enrolledCourses = await CourseApplication.find({
      userID: studentId,
      courseID: { $in: courseIds },
      status: { $regex: new RegExp("^approved$", "i") },
    }).populate({
      path: "courseID",
      select: "_id name",
      model: "Course",
    });

    if (enrolledCourses.length === 0) {
      return res
        .status(404)
        .json(ApiErrors(404, "Student is not enrolled in any of your courses"));
    }

    // Get attendance for each enrolled course
    const attendance = await Attendance.find({
      studentId: studentId,
      courseId: { $in: courseIds },
    })
      .populate("courseId", "name")
      .populate("markedBy", "name email")
      .populate("studentId", "name")
      .sort({ date: -1 });

    if (!attendance.length) {
      // If no attendance records found, return default absent status for each enrolled course
      const defaultAttendance = enrolledCourses.map((enrollment) => ({
        studentId: { _id: studentId, name: "Student" }, // You might want to populate this properly
        courseId: enrollment.courseID,
        status: "Absent",
        date: new Date(),
        markedBy: null,
        classDay: getClassDay(new Date()),
      }));

      return res
        .status(200)
        .json(
          ApiSuccess(
            200,
            defaultAttendance,
            "No attendance records found. Showing default status."
          )
        );
    }

    res
      .status(200)
      .json(
        ApiSuccess(200, attendance, "Attendance records fetched successfully")
      );
  } catch (error) {
    console.error("Error in getStudentAttendanceByTeacherId:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get attendance for a course
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId, date } = req.query;
    const query = { courseId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // If no date provided, get today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    // Get all enrolled students for the course
    const enrolledStudents = await CourseApplication.find({
      courseID: courseId,
      status: "Approved",
    }).populate({
      path: "userID",
      select: "_id name",
      model: "Student",
    });

    // Get attendance records
    const attendance = await Attendance.find(query)
      .populate("studentId", "name")
      .populate("markedBy", "name email")
      .sort({ date: -1 })
      .lean();

    // Create a map of existing attendance
    const attendanceMap = new Map();
    attendance.forEach((att) => {
      attendanceMap.set(att.studentId._id.toString(), att);
    });

    // Combine existing attendance with default absent status for students without attendance
    const combinedAttendance = enrolledStudents.map((enrollment) => {
      const studentId = enrollment.userID._id.toString();
      const existingRecord = attendanceMap.get(studentId);

      if (existingRecord) {
        return existingRecord;
      }

      return {
        studentId: enrollment.userID,
        courseId,
        status: "Absent",
        date: query.date.$gte,
        markedBy: null,
        classDay: getClassDay(query.date.$gte),
      };
    });

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          combinedAttendance,
          "Course attendance records fetched successfully"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { status, schedule, attendanceDate } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res
        .status(404)
        .json(ApiErrors(404, "Attendance record not found"));
    }

    if (status) attendance.status = status;
    if (schedule) {
      if (!Array.isArray(schedule) || schedule.length === 0) {
        return res
          .status(400)
          .json(
            ApiErrors(400, "Schedule must be provided with at least one day")
          );
      }
      attendance.schedule = schedule;
    }
    if (attendanceDate) {
      const newDate = new Date(attendanceDate);
      attendance.date = newDate;
      attendance.classDay = getClassDay(newDate);
    }

    await attendance.save();
    res
      .status(200)
      .json(ApiSuccess(200, attendance, "Attendance updated successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query);

    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "Present").length,
      absent: attendance.filter((a) => a.status === "Absent").length,
    };

    if (stats.total > 0) {
      stats.presentPercentage = (stats.present / stats.total) * 100;
      stats.absentPercentage = (stats.absent / stats.total) * 100;
    }

    res
      .status(200)
      .json(
        ApiSuccess(200, stats, "Attendance statistics fetched successfully")
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  getCourseAttendance,
  updateAttendance,
  getAttendanceStats,
  getStudentAttendanceByTeacherId,
};
