import express from 'express';
import {
  getStudentCourses,
  getStudentAttendance,
  getCourseAttendanceDetails,
  getStudentTimetable,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.get('/me/courses', getStudentCourses);
router.get('/me/attendance', getStudentAttendance);
router.get('/me/courses/:courseId/attendance', getCourseAttendanceDetails);
router.get('/me/timetable', getStudentTimetable);

export default router;
