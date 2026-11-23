import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'ATTENDANCE_MARKED',
        'ATTENDANCE_MODIFIED',
        'CORRECTION_APPROVED',
        'CORRECTION_REJECTED',
        'COURSE_CREATED',
        'FACULTY_ASSIGNED',
        'TIMETABLE_CREATED',
        'TIMETABLE_DELETED',
        'THRESHOLD_UPDATED',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Attendance', 'Course', 'CorrectionRequest', 'Timetable', 'DepartmentConfig', 'Session'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ courseId: 1, timestamp: -1 });
auditLogSchema.index({ studentId: 1 });
auditLogSchema.index({ actorId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
