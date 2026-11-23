import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  assignFaculty,
  enrollStudents,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', authorize('hod'), createCourse);
router.patch('/:id/assign-faculty', authorize('hod'), assignFaculty);
router.post('/:id/enrollments', authorize('hod'), enrollStudents);

export default router;
