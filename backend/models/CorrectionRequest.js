import mongoose from 'mongoose';

const correctionRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason category is required'],
      enum: ['Medical Leave', 'On-Duty College Activity', 'Technical / System Error', 'Biometric / Proxy Discrepancy', 'Other Official Reason'],
    },
    description: {
      type: String,
      required: [true, 'Detailed explanation is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    facultyResponse: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

correctionRequestSchema.index({ studentId: 1, sessionId: 1, status: 1 });
correctionRequestSchema.index({ courseId: 1, status: 1 });
correctionRequestSchema.index({ studentId: 1 });

export const CorrectionRequest = mongoose.model('CorrectionRequest', correctionRequestSchema);
