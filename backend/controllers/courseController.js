import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Get courses list (filtered by department, semester, type)
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req, res) => {
  try {
    const { department, semester, type, division } = req.query;

    const query = { isActive: true };
    if (department) query.department = department;
    else if (req.user.role === 'hod' || req.user.role === 'student') query.department = req.user.department;

    if (semester) query.semester = Number(semester);
    if (type) query.type = type;
    if (division) query.division = division;

    const courses = await Course.find(query)
      .populate('facultyId', 'name email facultyId')
      .sort({ code: 1, type: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Private
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('facultyId', 'name email facultyId department');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const enrolledCount = await Enrollment.countDocuments({ courseId: course._id, status: 'active' });

    res.status(200).json({
      success: true,
      course,
      enrolledCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create course offering
// @route   POST /api/courses
// @access  Private (HOD)
export const createCourse = async (req, res) => {
  try {
    const { code, name, department, semester, type, division, batch, credits, facultyId } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ success: false, message: 'Code, name, and type are required.' });
    }

    const dept = department || req.user.department;

    // Check unique course offering
    const existing = await Course.findOne({
      code: code.trim().toUpperCase(),
      type,
      division: division || 'A',
      batch: batch || null,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A course offering with this code, type, division, and batch already exists.',
      });
    }

    const course = await Course.create({
      code: code.trim().toUpperCase(),
      name,
      department: dept,
      semester: Number(semester) || 5,
      type,
      division: (division || 'A').toUpperCase(),
      batch: batch ? batch.toUpperCase() : null,
      credits: Number(credits) || (type === 'theory' ? 3 : 1),
      facultyId: facultyId || null,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course._id,
      courseId: course._id,
      details: `HOD created course ${course.code} - ${course.name} (${course.type})`,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign faculty to course
// @route   PATCH /api/courses/:id/assign-faculty
// @access  Private (HOD)
export const assignFaculty = async (req, res) => {
  try {
    const { facultyId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    let facultyUser = null;
    if (facultyId) {
      facultyUser = await User.findOne({ _id: facultyId, role: 'faculty' });
      if (!facultyUser) {
        return res.status(400).json({ success: false, message: 'Invalid faculty ID specified.' });
      }
    }

    const oldFaculty = course.facultyId;
    course.facultyId = facultyId || null;
    await course.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'FACULTY_ASSIGNED',
      entityType: 'Course',
      entityId: course._id,
      courseId: course._id,
      oldValue: oldFaculty,
      newValue: facultyUser ? facultyUser.name : 'Unassigned',
      details: `Assigned faculty to ${course.code}: ${facultyUser ? facultyUser.name : 'Unassigned'}`,
    });

    res.status(200).json({
      success: true,
      message: 'Faculty assignment updated.',
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll students into a course
// @route   POST /api/courses/:id/enrollments
// @access  Private (HOD)
export const enrollStudents = async (req, res) => {
  try {
    const { studentIds, batch } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of studentIds is required.' });
    }

    let enrolledCount = 0;
    for (const sid of studentIds) {
      const existing = await Enrollment.findOne({ studentId: sid, courseId });
      if (!existing) {
        await Enrollment.create({
          studentId: sid,
          courseId,
          batch: batch || course.batch || null,
        });
        enrolledCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Enrolled ${enrolledCount} students successfully.`,
      enrolledCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
