import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    type: {
      type: String,
      enum: ['theory', 'practical'],
      required: [true, 'Course type must be theory or practical'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
    },
    batch: {
      type: String,
      trim: true,
      uppercase: true,
      default: null, // Used for practical batches e.g. 'A1', 'A2', 'B1'
    },
    credits: {
      type: Number,
      default: 3,
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

// Compound index to ensure uniqueness for a given code, type, division, and batch
courseSchema.index({ code: 1, type: 1, division: 1, batch: 1 }, { unique: true });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ facultyId: 1 });

export const Course = mongoose.model('Course', courseSchema);
