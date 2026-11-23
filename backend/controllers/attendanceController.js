import { Attendance } from '../models/Attendance.js';
import { Session } from '../models/Session.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Mark or submit attendance for a session
// @route   POST /api/attendance
// @access  Private (Faculty, HOD)
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, records } = req.body;

    if (!sessionId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and a valid list of student attendance records are required.',
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const course = await Course.findById(session.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Role check: Faculty must own this course
    if (req.user.role === 'faculty' && course.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You are not assigned to instruct this course.',
      });
    }

    // Validate that each record has valid status
    for (const r of records) {
      if (!r.studentId || !['present', 'absent'].includes(r.status)) {
        return res.status(400).json({
          success: false,
          message: 'Every student record must have a valid studentId and status (present/absent).',
        });
      }
    }

    let presentCount = 0;
    let absentCount = 0;

    // Use bulk operations to upsert attendance records
    const bulkOps = records.map((r) => {
      if (r.status === 'present') presentCount++;
      else absentCount++;

      return {
        updateOne: {
          filter: { sessionId: session._id, studentId: r.studentId },
          update: {
            $set: {
              sessionId: session._id,
              courseId: course._id,
              studentId: r.studentId,
              status: r.status,
              markedBy: req.user._id,
              markedAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    await Attendance.bulkWrite(bulkOps);

    // Update counts on the session
    session.presentCount = presentCount;
    session.absentCount = absentCount;
    await session.save();

    // Create Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'ATTENDANCE_MARKED',
      entityType: 'Session',
      entityId: session._id,
      courseId: course._id,
      details: `Attendance recorded for session "${session.topic}" (${presentCount} present, ${absentCount} absent)`,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      presentCount,
      absentCount,
      totalMarked: records.length,
    });
  } catch (error) {
    console.error('[Mark Attendance Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance records for a specific session
// @route   GET /api/attendance/session/:sessionId
// @access  Private
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId)
      .populate('courseId', 'code name type division batch facultyId')
      .populate('facultyId', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const records = await Attendance.find({ sessionId })
      .populate('studentId', 'name studentId email division')
      .populate('markedBy', 'name');

    res.status(200).json({
      success: true,
      session,
      count: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modify single student attendance record (with audit logging)
// @route   PUT /api/attendance/:id
// @access  Private (Faculty, HOD)
export const updateSingleAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be present or absent.' });
    }

    const record = await Attendance.findById(id).populate('studentId', 'name studentId');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const course = await Course.findById(record.courseId);
    if (req.user.role === 'faculty' && course?.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const oldStatus = record.status;
    if (oldStatus === status) {
      return res.status(200).json({ success: true, message: 'No change in status.', record });
    }

    record.status = status;
    record.markedBy = req.user._id;
    record.markedAt = new Date();
    await record.save();

    // Update session counts
    const session = await Session.findById(record.sessionId);
    if (session) {
      if (status === 'present') {
        session.presentCount += 1;
        session.absentCount = Math.max(0, session.absentCount - 1);
      } else {
        session.absentCount += 1;
        session.presentCount = Math.max(0, session.presentCount - 1);
      }
      await session.save();
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'ATTENDANCE_MODIFIED',
      entityType: 'Attendance',
      entityId: record._id,
      courseId: record.courseId,
      studentId: record.studentId._id,
      oldValue: oldStatus,
      newValue: status,
      details: `Attendance manually changed from ${oldStatus} to ${status} for student ${record.studentId.name} (${record.studentId.studentId}). Reason: ${remark || 'Faculty manual edit'}`,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully.',
      record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
