import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
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
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: [true, 'Day of the week is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:mm)'],
    },
    room: {
      type: String,
      required: [true, 'Classroom/Lab location is required'],
      trim: true,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    batch: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timetableSchema.index({ facultyId: 1, day: 1 });
timetableSchema.index({ courseId: 1, day: 1 });
timetableSchema.index({ division: 1, day: 1 });
timetableSchema.index({ room: 1, day: 1 });

export const Timetable = mongoose.model('Timetable', timetableSchema);
