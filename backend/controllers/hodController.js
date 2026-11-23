import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { CorrectionRequest } from '../models/CorrectionRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { DepartmentConfig } from '../models/DepartmentConfig.js';
import { calculateAttendance } from '../utils/calculator.js';
import { generateCSV } from '../utils/csvExporter.js';

// @desc    Get HOD dashboard analytics
// @route   GET /api/hod/dashboard
// @access  Private (HOD)
export const getHODDashboard = async (req, res) => {
  try {
    const department = req.user.department;

    const deptConfig = await DepartmentConfig.findOne({ name: department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    // 1. Total counts
    const totalStudents = await User.countDocuments({ role: 'student', department, isActive: true });
    const totalFaculty = await User.countDocuments({ role: 'faculty', department, isActive: true });
    const courses = await Course.find({ department, isActive: true }).populate('facultyId', 'name');
    const totalCourses = courses.length;

    // 2. Pending corrections
    const courseIds = courses.map((c) => c._id);
    const pendingCorrections = await CorrectionRequest.countDocuments({
      courseId: { $in: courseIds },
      status: 'pending',
    });

    // 3. Course stats and overall department attendance
    const courseStats = [];
    let totalAttendedDept = 0;
    let totalRecordsDept = 0;
    let theoryPresent = 0, theoryTotal = 0;
    let practicalPresent = 0, practicalTotal = 0;

    for (const c of courses) {
      const sessions = await Session.find({ courseId: c._id, status: 'conducted' });
      const conducted = sessions.length;

      let cPresent = 0;
      let cTotal = 0;
      for (const s of sessions) {
        cPresent += s.presentCount;
        cTotal += s.presentCount + s.absentCount;
      }

      totalAttendedDept += cPresent;
      totalRecordsDept += cTotal;

      if (c.type === 'theory') {
        theoryPresent += cPresent;
        theoryTotal += cTotal;
      } else {
        practicalPresent += cPresent;
        practicalTotal += cTotal;
      }

      const enrolledCount = await Enrollment.countDocuments({ courseId: c._id, status: 'active' });
      const avg = cTotal > 0 ? Number(((cPresent / cTotal) * 100).toFixed(1)) : 0;

      courseStats.push({
        courseId: c._id,
        code: c.code,
        name: c.name,
        type: c.type,
        division: c.division,
        batch: c.batch,
        facultyName: c.facultyId ? c.facultyId.name : 'Unassigned',
        enrolledCount,
        conductedCount: conducted,
        avgAttendance: avg,
        isBelowThreshold: avg < threshold,
      });
    }

    const deptAverageAttendance = totalRecordsDept > 0 ? Number(((totalAttendedDept / totalRecordsDept) * 100).toFixed(1)) : 0;
    const theoryAvg = theoryTotal > 0 ? Number(((theoryPresent / theoryTotal) * 100).toFixed(1)) : 0;
    const practicalAvg = practicalTotal > 0 ? Number(((practicalPresent / practicalTotal) * 100).toFixed(1)) : 0;

    // 4. Calculate total distinct students below threshold in the department
    const students = await User.find({ role: 'student', department, isActive: true });
    let studentsBelowThresholdCount = 0;

    for (const student of students) {
      const studentEnrollments = await Enrollment.find({ studentId: student._id, status: 'active' });
      const sCourseIds = studentEnrollments.map((e) => e.courseId);

      const sSessions = await Session.find({ courseId: { $in: sCourseIds }, status: 'conducted' });
      const sSessionIds = sSessions.map((s) => s._id);

      const sAttendedCount = await Attendance.countDocuments({
        sessionId: { $in: sSessionIds },
        studentId: student._id,
        status: 'present',
      });

      const sStats = calculateAttendance({
        attended: sAttendedCount,
        conducted: sSessions.length,
        targetPercentage: threshold,
      });

      if (sStats.isShortage) {
        studentsBelowThresholdCount++;
      }
    }

    res.status(200).json({
      success: true,
      department,
      threshold,
      metrics: {
        totalStudents,
        totalFaculty,
        totalCourses,
        deptAverageAttendance,
        studentsBelowThreshold: studentsBelowThresholdCount,
        pendingCorrections,
      },
      comparison: {
        theoryAverage: theoryAvg,
        practicalAverage: practicalAvg,
      },
      courseStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get students in department with attendance summaries
// @route   GET /api/hod/students
// @access  Private (HOD)
export const getDepartmentStudents = async (req, res) => {
  try {
    const { semester, division, search } = req.query;
    const department = req.user.department;

    const query = { role: 'student', department, isActive: true };
    if (semester) query.semester = Number(semester);
    if (division) query.division = division.toUpperCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query).sort({ studentId: 1 });

    const deptConfig = await DepartmentConfig.findOne({ name: department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    const studentList = await Promise.all(
      students.map(async (s) => {
        const enrollments = await Enrollment.find({ studentId: s._id, status: 'active' });
        const courseIds = enrollments.map((e) => e.courseId);

        const sessions = await Session.find({ courseId: { $in: courseIds }, status: 'conducted' });
        const sessionIds = sessions.map((sess) => sess._id);

        const attendedCount = await Attendance.countDocuments({
          sessionId: { $in: sessionIds },
          studentId: s._id,
          status: 'present',
        });

        const stats = calculateAttendance({
          attended: attendedCount,
          conducted: sessions.length,
          targetPercentage: threshold,
        });

        return {
          _id: s._id,
          name: s.name,
          studentId: s.studentId,
          email: s.email,
          semester: s.semester,
          division: s.division,
          academicYear: s.academicYear,
          enrolledCoursesCount: enrollments.length,
          conductedSessions: sessions.length,
          attendedSessions: attendedCount,
          attendancePercentage: stats.percentage,
          formattedPercentage: stats.formattedPercentage,
          status: stats.status,
          isShortage: stats.isShortage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentList.length,
      threshold,
      students: studentList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get faculty members in department with assigned workload
// @route   GET /api/hod/faculty
// @access  Private (HOD)
export const getDepartmentFaculty = async (req, res) => {
  try {
    const department = req.user.department;
    const faculty = await User.find({ role: 'faculty', department, isActive: true }).sort({ name: 1 });

    const facultyWorkload = await Promise.all(
      faculty.map(async (f) => {
        const assignedCourses = await Course.find({ facultyId: f._id, isActive: true });
        const sessionsConducted = await Session.countDocuments({ facultyId: f._id, status: 'conducted' });

        return {
          _id: f._id,
          name: f.name,
          facultyId: f.facultyId,
          email: f.email,
          department: f.department,
          assignedCourses: assignedCourses.map((c) => ({
            _id: c._id,
            code: c.code,
            name: c.name,
            type: c.type,
            division: c.division,
            batch: c.batch,
          })),
          courseCount: assignedCourses.length,
          sessionsConducted,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: facultyWorkload.length,
      faculty: facultyWorkload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get department attendance shortage list with CSV export
// @route   GET /api/hod/shortage-report
// @access  Private (HOD)
export const getShortageReport = async (req, res) => {
  try {
    const { format } = req.query;
    const department = req.user.department;

    const deptConfig = await DepartmentConfig.findOne({ name: department });
    const threshold = deptConfig ? deptConfig.minimumAttendanceThreshold : 75;

    const students = await User.find({ role: 'student', department, isActive: true }).sort({ studentId: 1 });
    const shortageList = [];

    for (const s of students) {
      const enrollments = await Enrollment.find({ studentId: s._id, status: 'active' }).populate('courseId');

      for (const e of enrollments) {
        const course = e.courseId;
        if (!course || !course.isActive) continue;

        const sessionQuery = { courseId: course._id, status: 'conducted' };
        if (course.type === 'practical' && e.batch) sessionQuery.batch = e.batch;

        const sessions = await Session.find(sessionQuery);
        const sessionIds = sessions.map((sess) => sess._id);

        const attended = await Attendance.countDocuments({
          sessionId: { $in: sessionIds },
          studentId: s._id,
          status: 'present',
        });

        const stats = calculateAttendance({
          attended,
          conducted: sessions.length,
          targetPercentage: threshold,
        });

        if (stats.isShortage) {
          shortageList.push({
            studentId: s._id,
            prn: s.studentId,
            studentName: s.name,
            email: s.email,
            division: s.division,
            courseCode: course.code,
            courseName: course.name,
            courseType: course.type,
            attendedSessions: attended,
            conductedSessions: sessions.length,
            percentage: stats.percentage,
            formattedPercentage: stats.formattedPercentage,
            classesNeeded: stats.classesNeeded,
            threshold,
          });
        }
      }
    }

    if (format === 'csv') {
      const headers = ['PRN', 'Student Name', 'Division', 'Course Code', 'Course Name', 'Type', 'Attended', 'Conducted', 'Attendance %', 'Threshold %', 'Classes Needed'];
      const rows = shortageList.map((item) => [
        item.prn,
        item.studentName,
        item.division,
        item.courseCode,
        item.courseName,
        item.courseType,
        item.attendedSessions,
        item.conductedSessions,
        item.formattedPercentage,
        `${item.threshold}%`,
        item.classesNeeded,
      ]);

      const csvData = generateCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="MITAOE_${department.replace(/\s+/g, '_')}_Shortage_Report.csv"`);
      return res.status(200).send(csvData);
    }

    res.status(200).json({
      success: true,
      threshold,
      count: shortageList.length,
      shortageList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system audit logs (paginated)
// @route   GET /api/hod/audit-logs
// @access  Private (HOD)
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { action } = req.query;

    const query = {};
    if (action) query.action = action;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('actorId', 'name email role')
      .populate('courseId', 'code name')
      .populate('studentId', 'name studentId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalLogs: total,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update department minimum attendance threshold
// @route   PATCH /api/hod/threshold
// @access  Private (HOD)
export const updateDepartmentThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;
    const num = Number(threshold);

    if (isNaN(num) || num < 50 || num > 100) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a valid number between 50 and 100.',
      });
    }

    const dept = await DepartmentConfig.findOneAndUpdate(
      { name: req.user.department },
      { minimumAttendanceThreshold: num },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      actorId: req.user._id,
      action: 'THRESHOLD_UPDATED',
      entityType: 'DepartmentConfig',
      entityId: dept._id,
      newValue: num,
      details: `HOD updated minimum attendance threshold to ${num}% for ${req.user.department}`,
    });

    res.status(200).json({
      success: true,
      message: `Minimum attendance threshold updated to ${num}%.`,
      threshold: dept.minimumAttendanceThreshold,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
