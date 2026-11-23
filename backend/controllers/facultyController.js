import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { Timetable } from '../models/Timetable.js';
import { CorrectionRequest } from '../models/CorrectionRequest.js';
import { DepartmentConfig } from '../models/DepartmentConfig.js';
import { calculateAttendance } from '../utils/calculator.js';
import { generateCSV } from '../utils/csvExporter.js';

// @desc    Get faculty dashboard metrics
// @route   GET /api/faculty/me/dashboard
// @access  Private (Faculty)
export const getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user._id;

    // 1. Assigned courses
    const courses = await Course.find({ facultyId, isActive: true });
    const courseIds = courses.map((c) => c._id);

    // 2. Total enrolled students across assigned courses (distinct count)
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds }, status: 'active' });
    const uniqueStudentIds = new Set(enrollments.map((e) => e.studentId.toString()));

    // 3. Total sessions conducted
    const sessionsConducted = await Session.countDocuments({
      facultyId,
      status: 'conducted',
    });

    // 4. Pending correction requests
    const pendingCorrections = await CorrectionRequest.countDocuments({
      courseId: { $in: courseIds },
      status: 'pending',
    });

    // 5. Today's scheduled classes
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date().getDay()];

    const todayTimetable = await Timetable.find({
      facultyId,
      day: currentDayName,
      isActive: true,
    }).populate('courseId', 'code name type division batch');

    // 6. Course-wise attendance averages
    const courseStats = [];
    for (const course of courses) {
      const courseSessions = await Session.find({ courseId: course._id, status: 'conducted' });
      const conductedCount = courseSessions.length;

      let totalPresent = 0;
      let totalRecords = 0;

      for (const s of courseSessions) {
        totalPresent += s.presentCount;
        totalRecords += s.presentCount + s.absentCount;
      }

      const avgPercentage = totalRecords > 0 ? Number(((totalPresent / totalRecords) * 100).toFixed(1)) : 0;
      const enrolledCount = enrollments.filter((e) => e.courseId.toString() === course._id.toString()).length;

      courseStats.push({
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        type: course.type,
        division: course.division,
        batch: course.batch,
        enrolledCount,
        conductedCount,
        avgAttendance: avgPercentage,
      });
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalCourses: courses.length,
        totalStudents: uniqueStudentIds.size,
        sessionsConducted,
        pendingCorrections,
      },
      todaySchedule: todayTimetable,
      courseStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get courses assigned to faculty
// @route   GET /api/faculty/me/courses
// @access  Private (Faculty)
export const getFacultyCourses = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const courses = await Course.find({ facultyId, isActive: true }).sort({ code: 1 });

    const courseList = await Promise.all(
      courses.map(async (c) => {
        let enrollmentQuery = { courseId: c._id, status: 'active' };
        if (c.type === 'practical' && c.batch) {
          enrollmentQuery.batch = c.batch;
        }
        const studentCount = await Enrollment.countDocuments(enrollmentQuery);
        const sessionCount = await Session.countDocuments({ courseId: c._id, status: 'conducted' });

        return {
          _id: c._id,
          code: c.code,
          name: c.name,
          type: c.type,
          department: c.department,
          semester: c.semester,
          division: c.division,
          batch: c.batch,
          credits: c.credits,
          studentCount,
          sessionCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: courseList.length,
      courses: courseList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get roster of enrolled students for a specific assigned course
// @route   GET /api/faculty/courses/:courseId/students
// @access  Private (Faculty, HOD)
export const getCourseEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Role check: Faculty must be assigned to course (unless HOD)
    if (req.user.role === 'faculty' && course.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to instruct this course.',
      });
    }

    let enrollmentQuery = { courseId, status: 'active' };
    if (course.type === 'practical' && course.batch) {
      enrollmentQuery.batch = course.batch;
    }

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('studentId', 'name email studentId division semester academicYear')
      .sort({ 'studentId.studentId': 1 });

    const students = enrollments
      .filter((e) => e.studentId)
      .map((e) => ({
        _id: e.studentId._id,
        name: e.studentId.name,
        email: e.studentId.email,
        studentId: e.studentId.studentId,
        division: e.studentId.division,
        batch: e.batch,
        semester: e.studentId.semester,
      }));

    res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        code: course.code,
        name: course.name,
        type: course.type,
        division: course.division,
        batch: course.batch,
      },
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get faculty weekly timetable
// @route   GET /api/faculty/me/timetable
// @access  Private (Faculty)
export const getFacultyTimetable = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const timetable = await Timetable.find({ facultyId, isActive: true })
      .populate('courseId', 'code name type division batch')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: timetable.length,
      timetable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate course-level attendance report & analytics (with CSV support)
// @route   GET /api/faculty/courses/:courseId/report
// @access  Private (Faculty, HOD)
export const getCourseReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const format = req.query.format; // 'csv' or json

    const course = await Course.findById(courseId).populate('facultyId', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user.role === 'faculty' && course.facultyId?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized course access.' });
    }

    const deptConfig = await DepartmentConfig.findOne({ name: course.department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    // Get sessions
    const sessions = await Session.find({ courseId, status: 'conducted' }).sort({ sessionDate: 1 });
    const sessionIds = sessions.map((s) => s._id);

    // Get enrolled students
    let enrollmentQuery = { courseId, status: 'active' };
    if (course.type === 'practical' && course.batch) {
      enrollmentQuery.batch = course.batch;
    }

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('studentId', 'name studentId email division')
      .sort({ 'studentId.studentId': 1 });

    const studentList = enrollments.map((e) => e.studentId).filter(Boolean);

    // Preload all attendance records for these sessions
    const allAttendance = await Attendance.find({ sessionId: { $in: sessionIds } });
    const studentAttendanceMap = new Map();

    for (const record of allAttendance) {
      const key = `${record.studentId.toString()}_${record.sessionId.toString()}`;
      studentAttendanceMap.set(key, record.status);
    }

    const studentSummaries = [];
    const belowThresholdStudents = [];

    for (const student of studentList) {
      let attended = 0;
      for (const s of sessions) {
        if (studentAttendanceMap.get(`${student._id.toString()}_${s._id.toString()}`) === 'present') {
          attended++;
        }
      }

      const stats = calculateAttendance({
        attended,
        conducted: sessions.length,
        targetPercentage: threshold,
      });

      const entry = {
        studentId: student._id,
        prn: student.studentId,
        name: student.name,
        email: student.email,
        division: student.division,
        attendedSessions: attended,
        totalSessions: sessions.length,
        percentage: stats.percentage,
        formattedPercentage: stats.formattedPercentage,
        status: stats.status,
        classesNeeded: stats.classesNeeded,
        isShortage: stats.isShortage,
      };

      studentSummaries.push(entry);
      if (stats.isShortage) {
        belowThresholdStudents.push(entry);
      }
    }

    // If CSV download requested
    if (format === 'csv') {
      const headers = ['PRN', 'Student Name', 'Division', 'Attended', 'Conducted', 'Attendance %', 'Status', 'Shortage'];
      const rows = studentSummaries.map((s) => [
        s.prn,
        s.name,
        s.division,
        s.attendedSessions,
        s.totalSessions,
        s.formattedPercentage,
        s.status,
        s.isShortage ? 'YES' : 'NO',
      ]);

      const csvData = generateCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${course.code}_attendance_report.csv"`);
      return res.status(200).send(csvData);
    }

    res.status(200).json({
      success: true,
      course,
      threshold,
      totalSessions: sessions.length,
      totalEnrolled: studentList.length,
      belowThresholdCount: belowThresholdStudents.length,
      students: studentSummaries,
      belowThresholdList: belowThresholdStudents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
