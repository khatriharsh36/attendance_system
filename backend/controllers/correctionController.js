import { CorrectionRequest } from '../models/CorrectionRequest.js';
import { Attendance } from '../models/Attendance.js';
import { Session } from '../models/Session.js';
import { Course } from '../models/Course.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Submit a new attendance correction request
// @route   POST /api/corrections
// @access  Private (Student)
export const submitCorrectionRequest = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { sessionId, reason, description } = req.body;

    if (!sessionId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, reason category, and detailed description are required.',
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Check existing attendance record to verify student was actually marked absent
    const attendanceRecord = await Attendance.findOne({ sessionId, studentId });
    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for this session.',
      });
    }

    if (attendanceRecord.status === 'present') {
      return res.status(400).json({
        success: false,
        message: 'You are already marked present for this session. No correction needed.',
      });
    }

    // Constraint: Prevent duplicate active (pending) correction requests for the same session
    const existingPending = await CorrectionRequest.findOne({
      studentId,
      sessionId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending correction request for this session.',
      });
    }

    const request = await CorrectionRequest.create({
      studentId,
      sessionId,
      courseId: session.courseId,
      reason,
      description,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Correction request submitted for faculty review.',
      request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's submitted correction requests
// @route   GET /api/corrections/student
// @access  Private (Student)
export const getStudentCorrectionRequests = async (req, res) => {
  try {
    const studentId = req.user._id;
    const requests = await CorrectionRequest.find({ studentId })
      .populate('courseId', 'code name type')
      .populate('sessionId', 'sessionDate topic startTime endTime')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get correction requests for faculty's assigned courses
// @route   GET /api/corrections/faculty
// @access  Private (Faculty)
export const getFacultyCorrectionRequests = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const assignedCourses = await Course.find({ facultyId }).select('_id');
    const courseIds = assignedCourses.map((c) => c._id);

    const requests = await CorrectionRequest.find({ courseId: { $in: courseIds } })
      .populate('studentId', 'name studentId email division')
      .populate('courseId', 'code name type')
      .populate('sessionId', 'sessionDate topic startTime endTime')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review (Approve/Reject) correction request
// @route   PATCH /api/corrections/:id
// @access  Private (Faculty, HOD)
export const reviewCorrectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected.',
      });
    }

    const request = await CorrectionRequest.findById(id).populate('studentId', 'name studentId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found.' });
    }

    const course = await Course.findById(request.courseId);
    if (req.user.role === 'faculty' && course?.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You are not assigned to instruct this course.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}.`,
      });
    }

    request.status = status;
    request.facultyResponse = remarks || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, update attendance record from absent to present
    if (status === 'approved') {
      const attendance = await Attendance.findOne({
        sessionId: request.sessionId,
        studentId: request.studentId._id,
      });

      if (attendance) {
        const oldVal = attendance.status;
        attendance.status = 'present';
        attendance.markedBy = req.user._id;
        attendance.markedAt = new Date();
        await attendance.save();

        // Update session counts
        const session = await Session.findById(request.sessionId);
        if (session) {
          session.presentCount += 1;
          session.absentCount = Math.max(0, session.absentCount - 1);
          await session.save();
        }

        // Audit Log
        await AuditLog.create({
          actorId: req.user._id,
          action: 'CORRECTION_APPROVED',
          entityType: 'CorrectionRequest',
          entityId: request._id,
          courseId: request.courseId,
          studentId: request.studentId._id,
          oldValue: oldVal,
          newValue: 'present',
          details: `Approved attendance correction request for ${request.studentId.name} (${request.studentId.studentId}). Remarks: ${remarks || 'None'}`,
        });
      }
    } else {
      // Log rejection
      await AuditLog.create({
        actorId: req.user._id,
        action: 'CORRECTION_REJECTED',
        entityType: 'CorrectionRequest',
        entityId: request._id,
        courseId: request.courseId,
        studentId: request.studentId._id,
        details: `Rejected attendance correction request for ${request.studentId.name} (${request.studentId.studentId}). Remarks: ${remarks || 'None'}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Correction request has been ${status}.`,
      request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
