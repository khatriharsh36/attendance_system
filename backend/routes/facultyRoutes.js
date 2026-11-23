import express from 'express';
import {
  getFacultyDashboard,
  getFacultyCourses,
  getCourseEnrolledStudents,
  getFacultyTimetable,
  getCourseReport,
} from '../controllers/facultyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me/dashboard', authorize('faculty'), getFacultyDashboard);
router.get('/me/courses', authorize('faculty'), getFacultyCourses);
router.get('/me/timetable', authorize('faculty'), getFacultyTimetable);
router.get('/courses/:courseId/students', authorize('faculty', 'hod'), getCourseEnrolledStudents);
router.get('/courses/:courseId/report', authorize('faculty', 'hod'), getCourseReport);

export default router;
