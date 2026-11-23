import { Timetable } from '../models/Timetable.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper: check if two time strings "HH:mm" overlap
const timesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

// @desc    Get timetable slots
// @route   GET /api/timetable
// @access  Private
export const getTimetable = async (req, res) => {
  try {
    const { division, day, facultyId, courseId } = req.query;

    const query = { isActive: true };
    if (division) query.division = division;
    if (day) query.day = day;
    if (facultyId) query.facultyId = facultyId;
    if (courseId) query.courseId = courseId;

    const slots = await Timetable.find(query)
      .populate('courseId', 'code name type department semester division batch')
      .populate('facultyId', 'name email facultyId')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new timetable slot with conflict detection
// @route   POST /api/timetable
// @access  Private (HOD)
export const createTimetableSlot = async (req, res) => {
  try {
    const { courseId, facultyId, day, startTime, endTime, room, division, batch } = req.body;

    if (!courseId || !facultyId || !day || !startTime || !endTime || !room || !division) {
      return res.status(400).json({
        success: false,
        message: 'Course, faculty, day, start time, end time, room, and division are required.',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be strictly earlier than end time.',
      });
    }

    // Check conflicts on the same day
    const daySlots = await Timetable.find({ day, isActive: true })
      .populate('courseId', 'code name')
      .populate('facultyId', 'name');

    for (const slot of daySlots) {
      if (timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        // 1. Room conflict
        if (slot.room.toLowerCase().trim() === room.toLowerCase().trim()) {
          return res.status(409).json({
            success: false,
            message: `Room conflict: ${room} is already booked for ${slot.courseId?.code || 'another class'} from ${slot.startTime} to ${slot.endTime} on ${day}.`,
          });
        }

        // 2. Faculty conflict
        if (slot.facultyId?._id?.toString() === facultyId.toString()) {
          return res.status(409).json({
            success: false,
            message: `Faculty conflict: ${slot.facultyId?.name || 'This faculty'} is already assigned to another class (${slot.startTime} - ${slot.endTime}) on ${day}.`,
          });
        }

        // 3. Division & Batch conflict
        if (slot.division === division) {
          // If neither has batch or both share same batch
          if (!batch || !slot.batch || batch === slot.batch) {
            return res.status(409).json({
              success: false,
              message: `Student group conflict: Division ${division} ${batch ? `(Batch ${batch})` : ''} already has a scheduled session (${slot.startTime} - ${slot.endTime}) on ${day}.`,
            });
          }
        }
      }
    }

    const newSlot = await Timetable.create({
      courseId,
      facultyId,
      day,
      startTime,
      endTime,
      room,
      division: division.toUpperCase(),
      batch: batch ? batch.toUpperCase() : null,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'TIMETABLE_CREATED',
      entityType: 'Timetable',
      entityId: newSlot._id,
      courseId,
      details: `Created timetable slot for ${day} ${startTime}-${endTime} in ${room} (Div ${division})`,
    });

    res.status(201).json({
      success: true,
      message: 'Timetable slot created successfully.',
      slot: newSlot,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete timetable slot
// @route   DELETE /api/timetable/:id
// @access  Private (HOD)
export const deleteTimetableSlot = async (req, res) => {
  try {
    const slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    }

    await slot.deleteOne();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'TIMETABLE_DELETED',
      entityType: 'Timetable',
      entityId: slot._id,
      courseId: slot.courseId,
      details: `Deleted timetable slot for ${slot.day} ${slot.startTime}-${slot.endTime} (${slot.room})`,
    });

    res.status(200).json({
      success: true,
      message: 'Timetable slot deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
