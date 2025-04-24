const Attendance = require("../models/attendance");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

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

// Validate if the current day is in the student's schedule
const validateSchedule = (currentDay, schedule) => {
  if (!schedule.includes(currentDay)) {
    throw new Error(
      `Attendance can only be marked on scheduled days: ${schedule.join(", ")}`
    );
  }
};

// Mark attendance for a single student
const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, schedule, attendanceDate } = req.body;
    const markedBy = req.userID;

    // Use provided date or current date
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    const classDay = getClassDay(date);

    // Validate schedule
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json(
          ApiErrors(400, "Schedule must be provided with at least one day")
        );
    }

    // Validate if the day is in schedule
    validateSchedule(classDay, schedule);

    const attendance = new Attendance({
      studentId,
      courseId,
      status,
      markedBy,
      date,
      classDay,
      schedule,
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
  try {
    const { courseId, attendanceList, schedule, attendanceDate } = req.body;
    const markedBy = req.userID;

    // Use provided date or current date
    const date = attendanceDate ? new Date(attendanceDate) : new Date();
    const classDay = getClassDay(date);

    // Validate schedule
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json(
          ApiErrors(400, "Schedule must be provided with at least one day")
        );
    }

    // Validate if the day is in schedule
    validateSchedule(classDay, schedule);

    const attendanceRecords = attendanceList.map((record) => ({
      studentId: record.studentId,
      courseId,
      status: record.status,
      markedBy,
      date,
      classDay,
      schedule,
    }));

    const savedRecords = await Attendance.insertMany(attendanceRecords, {
      ordered: false,
    });
    res
      .status(201)
      .json(
        ApiSuccess(201, savedRecords, "Bulk attendance marked successfully")
      );
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json(ApiErrors(400, "Some attendance records already exist"));
    }
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get attendance for a student
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.query;
    const query = { studentId };

    if (courseId) query.courseId = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("courseId", "name")
      .populate("markedBy", "name email")
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
