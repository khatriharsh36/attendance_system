import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { Timetable } from '../models/Timetable.js';
import { DepartmentConfig } from '../models/DepartmentConfig.js';
import { calculateAttendance } from '../utils/calculator.js';

// @desc    Get student profile & enrolled courses
// @route   GET /api/students/me/courses
// @access  Private (Student)
export const getStudentCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user._id,
      status: 'active',
    }).populate({
      path: 'courseId',
      populate: { path: 'facultyId', select: 'name email facultyId' },
    });

    const courses = enrollments
      .filter((e) => e.courseId && e.courseId.isActive)
      .map((e) => ({
        enrollmentId: e._id,
        course: e.courseId,
        enrolledBatch: e.batch,
        enrolledAt: e.enrolledAt,
      }));

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get course-wise attendance and overall statistics
// @route   GET /api/students/me/attendance
// @access  Private (Student)
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get department threshold
    const deptConfig = await DepartmentConfig.findOne({ name: req.user.department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    // Get active enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active',
    }).populate({
      path: 'courseId',
      populate: { path: 'facultyId', select: 'name email' },
    });

    const courseSummaries = [];
    let totalAttendedAll = 0;
    let totalConductedAll = 0;
    let coursesBelowThreshold = 0;
    const shortageAlerts = [];

    for (const enrollment of enrollments) {
      const course = enrollment.courseId;
      if (!course || !course.isActive) continue;

      // Filter sessions for this course that are 'conducted'
      // If it's a practical course and has a batch, only include sessions for that batch
      const sessionQuery = {
        courseId: course._id,
        status: 'conducted',
      };
      if (course.type === 'practical' && enrollment.batch) {
        sessionQuery.$or = [{ batch: enrollment.batch }, { batch: null }];
      }

      const sessions = await Session.find(sessionQuery).select('_id sessionDate topic startTime endTime');
      const conductedCount = sessions.length;
      const sessionIds = sessions.map((s) => s._id);

      // Find attendance records for this student
      const attendances = await Attendance.find({
        sessionId: { $in: sessionIds },
        studentId,
      });

      const attendedCount = attendances.filter((a) => a.status === 'present').length;

      totalAttendedAll += attendedCount;
      totalConductedAll += conductedCount;

      const stats = calculateAttendance({
        attended: attendedCount,
        conducted: conductedCount,
        targetPercentage: threshold,
      });

      if (stats.isShortage) {
        coursesBelowThreshold++;
        shortageAlerts.push({
          courseId: course._id,
          courseCode: course.code,
          courseName: course.name,
          type: course.type,
          currentPercentage: stats.percentage,
          threshold,
          classesNeeded: stats.classesNeeded,
          message: `Your attendance in ${course.name} (${course.code}) is ${stats.formattedPercentage}, which is below the required ${threshold}%. You need to attend ${stats.classesNeeded} consecutive upcoming classes to reach the threshold.`,
        });
      }

      courseSummaries.push({
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        type: course.type,
        division: course.division,
        batch: enrollment.batch || course.batch,
        facultyName: course.facultyId ? course.facultyId.name : 'Not Assigned',
        attendedSessions: attendedCount,
        conductedSessions: conductedCount,
        percentage: stats.percentage,
        formattedPercentage: stats.formattedPercentage,
        status: stats.status,
        classesNeeded: stats.classesNeeded,
        canMiss: stats.canMiss,
        isShortage: stats.isShortage,
      });
    }

    const overallStats = calculateAttendance({
      attended: totalAttendedAll,
      conducted: totalConductedAll,
      targetPercentage: threshold,
    });

    res.status(200).json({
      success: true,
      threshold,
      overall: {
        totalCourses: courseSummaries.length,
        totalAttended: totalAttendedAll,
        totalConducted: totalConductedAll,
        percentage: overallStats.percentage,
        formattedPercentage: overallStats.formattedPercentage,
        status: overallStats.status,
        coursesBelowThreshold,
      },
      courses: courseSummaries,
      shortageAlerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed session history for a specific course
// @route   GET /api/students/me/courses/:courseId/attendance
// @access  Private (Student)
export const getCourseAttendanceDetails = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course.',
      });
    }

    const course = await Course.findById(courseId).populate('facultyId', 'name email facultyId');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const deptConfig = await DepartmentConfig.findOne({ name: req.user.department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    const sessionQuery = {
      courseId: course._id,
      status: 'conducted',
    };
    if (course.type === 'practical' && enrollment.batch) {
      sessionQuery.$or = [{ batch: enrollment.batch }, { batch: null }];
    }

    const sessions = await Session.find(sessionQuery).sort({ sessionDate: 1, startTime: 1 });
    const sessionIds = sessions.map((s) => s._id);

    const attendances = await Attendance.find({
      sessionId: { $in: sessionIds },
      studentId,
    });

    const attendanceMap = new Map();
    attendances.forEach((a) => attendanceMap.set(a.sessionId.toString(), a));

    let runningAttended = 0;
    const sessionHistory = sessions.map((s, index) => {
      const record = attendanceMap.get(s._id.toString());
      const isPresent = record ? record.status === 'present' : false;
      if (isPresent) runningAttended++;

      const conductedSoFar = index + 1;
      const trendPercentage = Number(((runningAttended / conductedSoFar) * 100).toFixed(1));

      return {
        sessionId: s._id,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        batch: s.batch,
        status: isPresent ? 'present' : 'absent',
        attendanceId: record ? record._id : null,
        cumulativePercentage: trendPercentage,
      };
    });

    const totalConducted = sessions.length;
    const totalAttended = runningAttended;
    const stats = calculateAttendance({
      attended: totalAttended,
      conducted: totalConducted,
      targetPercentage: threshold,
    });

    res.status(200).json({
      success: true,
      course,
      threshold,
      summary: {
        attended: totalAttended,
        conducted: totalConducted,
        percentage: stats.percentage,
        formattedPercentage: stats.formattedPercentage,
        status: stats.status,
        classesNeeded: stats.classesNeeded,
        canMiss: stats.canMiss,
        isShortage: stats.isShortage,
      },
      sessions: sessionHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student weekly timetable and today's schedule
// @route   GET /api/students/me/timetable
// @access  Private (Student)
export const getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({ studentId, status: 'active' });
    const courseIds = enrollments.map((e) => e.courseId);
    const batchMap = new Map();
    enrollments.forEach((e) => batchMap.set(e.courseId.toString(), e.batch));

    const timetableSlots = await Timetable.find({
      courseId: { $in: courseIds },
      division: req.user.division,
      isActive: true,
    })
      .populate('courseId', 'code name type')
      .populate('facultyId', 'name email')
      .sort({ day: 1, startTime: 1 });

    // Filter practical slots for the student's assigned batch
    const filteredSlots = timetableSlots.filter((slot) => {
      if (slot.courseId?.type === 'practical' && slot.batch) {
        const studentBatch = batchMap.get(slot.courseId._id.toString());
        return slot.batch === studentBatch;
      }
      return true;
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date().getDay()];

    const todaySlots = filteredSlots.filter((slot) => slot.day === currentDayName);

    res.status(200).json({
      success: true,
      currentDay: currentDayName,
      todaySlots,
      timetable: filteredSlots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
