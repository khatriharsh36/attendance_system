import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'College email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'hod'],
      required: [true, 'User role is required'],
    },
    studentId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    facultyId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', 'Final Year'],
      default: 'Third Year',
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 5,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
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

// Unique compound indexes
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ facultyId: 1 }, { unique: true, sparse: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
