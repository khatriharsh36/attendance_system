import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    batch: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'dropped'],
      default: 'active',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ studentId: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
