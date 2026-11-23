import { Session } from '../models/Session.js';
import { Course } from '../models/Course.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Create a new class session
// @route   POST /api/sessions
// @access  Private (Faculty, HOD)
export const createSession = async (req, res) => {
  try {
    const { courseId, sessionDate, startTime, endTime, topic, batch } = req.body;

    if (!courseId || !sessionDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, session date, start time, and end time are required.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Role ownership check: faculty must be assigned to this course (unless HOD)
    if (req.user.role === 'faculty' && course.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You are not assigned to instruct this course.',
      });
    }

    const targetDate = new Date(sessionDate);
    const now = new Date();

    // Constraint: Never accept future sessions as already conducted
    // Allow up to current day end (23:59:59)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (targetDate > endOfToday) {
      return res.status(400).json({
        success: false,
        message: 'Cannot record a session for a future date as conducted.',
      });
    }

    // Check duplicate session for same course, date, and start time
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const nextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const duplicateQuery = {
      courseId,
      sessionDate: { $gte: startOfDay, $lt: nextDay },
      startTime,
      status: { $ne: 'cancelled' },
    };
    if (batch) duplicateQuery.batch = batch;

    const existing = await Session.findOne(duplicateQuery);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A session for this course is already scheduled/recorded at ${startTime} on this date.`,
      });
    }

    const session = await Session.create({
      courseId,
      facultyId: course.facultyId || req.user._id,
      sessionDate: targetDate,
      startTime,
      endTime,
      topic: topic || 'Regular Lecture / Lab Session',
      batch: batch || course.batch || null,
      status: 'conducted',
      presentCount: 0,
      absentCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully.',
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all sessions for a course
// @route   GET /api/sessions/course/:courseId
// @access  Private
export const getCourseSessions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { batch } = req.query;

    const query = { courseId };
    if (batch) query.batch = batch;

    const sessions = await Session.find(query)
      .populate('facultyId', 'name email')
      .sort({ sessionDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session details by ID
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('courseId', 'code name type department semester division batch')
      .populate('facultyId', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update session status (e.g. mark cancelled)
// @route   PATCH /api/sessions/:id
// @access  Private (Faculty, HOD)
export const updateSessionStatus = async (req, res) => {
  try {
    const { status, topic } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const course = await Course.findById(session.courseId);
    if (req.user.role === 'faculty' && course?.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const oldStatus = session.status;
    if (status) session.status = status;
    if (topic) session.topic = topic;

    await session.save();

    if (status && status !== oldStatus) {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'ATTENDANCE_MODIFIED',
        entityType: 'Session',
        entityId: session._id,
        courseId: session.courseId,
        oldValue: oldStatus,
        newValue: status,
        details: `Session status modified from ${oldStatus} to ${status}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session updated successfully.',
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
