import { User } from '../models/User.js';
import { sendTokenResponse } from '../middleware/auth.js';

// @desc    Register a student or faculty account
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      facultyId,
      department,
      academicYear,
      semester,
      division,
    } = req.body;

    // Reject HOD registration via public endpoint
    if (role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'HOD accounts cannot be registered publicly. They must be provisioned by system administration.',
      });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Only student and faculty accounts may register.',
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A user with this college email already exists.',
      });
    }

    // Role-specific validations & unique ID checks
    if (role === 'student') {
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'PRN / Student ID is required for students.' });
      }
      const existingPRN = await User.findOne({ studentId: studentId.trim().toUpperCase() });
      if (existingPRN) {
        return res.status(400).json({ success: false, message: 'A student with this PRN already exists.' });
      }
    }

    if (role === 'faculty') {
      if (!facultyId) {
        return res.status(400).json({ success: false, message: 'Employee ID is required for faculty.' });
      }
      const existingEmpId = await User.findOne({ facultyId: facultyId.trim().toUpperCase() });
      if (existingEmpId) {
        return res.status(400).json({ success: false, message: 'A faculty member with this Employee ID already exists.' });
      }
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      studentId: role === 'student' ? studentId.trim().toUpperCase() : undefined,
      facultyId: role === 'faculty' ? facultyId.trim().toUpperCase() : undefined,
      department,
      academicYear: role === 'student' ? (academicYear || 'Third Year') : undefined,
      semester: role === 'student' ? (Number(semester) || 5) : undefined,
      division: role === 'student' ? (division || 'A').toUpperCase() : undefined,
    });

    sendTokenResponse(newUser, 201, res);
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both college email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact department administrator.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
