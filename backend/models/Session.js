import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['conducted', 'cancelled'],
      default: 'conducted',
    },
    topic: {
      type: String,
      trim: true,
      default: 'Regular Lecture / Lab Session',
    },
    batch: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    presentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ courseId: 1, sessionDate: 1 });
sessionSchema.index({ facultyId: 1, sessionDate: 1 });

export const Session = mongoose.model('Session', sessionSchema);
