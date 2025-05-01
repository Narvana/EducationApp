const Attendance = require("../models/attendance");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const Student = require("../models/student");
const CourseApplication = require("../models/courseApplication");
const mongoose = require("mongoose");

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

// Validate instructor assignment
const validateInstructor = async (instructorId, courseId) => {
  const instructor = await Instructor.findOne({
    _id: instructorId,
    assignedCourses: courseId,
  });
  if (!instructor) {
    throw new Error("Instructor is not assigned to this course");
  }
  return instructor;
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
    const {
      studentId,
      courseId,
      status,
      schedule,
      startTime,
      endTime,
      remarks,
      attendanceDate,
    } = req.body;
    const markedBy = req.userID;

    // Validate future dates
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    if (date > new Date()) {
      return res
        .status(400)
        .json(ApiErrors(400, "Cannot mark attendance for future dates"));
    }

    const classDay = getClassDay(date);

    // Validate schedule
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json(
          ApiErrors(400, "Schedule must be provided with at least one day")
        );
    }
    validateSchedule(classDay, schedule);

    // Validate time format
    validateTimeFormat(startTime);
    validateTimeFormat(endTime);

    // Validate enrollment
    await validateEnrollment(studentId, courseId);

    // Validate instructor
    await validateInstructor(markedBy, courseId);

    const attendance = new Attendance({
      studentId,
      courseId,
      status,
      markedBy,
      date,
      classDay,
      schedule,
      startTime,
      endTime,
      remarks,
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
    const markedBy = req.userID;

    // Validate future dates
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    if (date > new Date()) {
      return res
        .status(400)
        .json(ApiErrors(400, "Cannot mark attendance for future dates"));
    }

    const classDay = getClassDay(date);

    // Validate schedule
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json(
          ApiErrors(400, "Schedule must be provided with at least one day")
        );
    }
    validateSchedule(classDay, schedule);

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
      schedule,
      startTime,
      endTime,
      remarks: record.remarks,
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
    const { studentId, startDate, endDate } = req.query;
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
        status: "approved",
      }).populate({
        path: "courseID",
        select: "_id name",
        model: "Course",
      });

      // First get all students who have attendance marked for today
      const existingAttendance = await Attendance.find({
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
        .populate("studentId", "name")
        .populate("courseId", "name");

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
              markedBy: null,
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
                markedBy: null,
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
      status: "approved",
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

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("courseId", "name")
      .populate("markedBy", "name email")
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
    }

    const attendance = await Attendance.find(query)
      .populate("studentId", "name")
      .populate("markedBy", "name email")
      .sort({ date: -1 });

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          attendance,
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
};
