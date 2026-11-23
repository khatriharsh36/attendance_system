import mongoose from 'mongoose';

const departmentConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    minimumAttendanceThreshold: {
      type: Number,
      default: 75,
      min: 50,
      max: 100,
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

export const DepartmentConfig = mongoose.model('DepartmentConfig', departmentConfigSchema);
