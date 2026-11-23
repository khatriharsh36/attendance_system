import express from 'express';
import {
  createSession,
  getCourseSessions,
  getSessionById,
  updateSessionStatus,
} from '../controllers/sessionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('faculty', 'hod'), createSession);
router.get('/course/:courseId', getCourseSessions);
router.get('/:id', getSessionById);
router.patch('/:id', authorize('faculty', 'hod'), updateSessionStatus);

export default router;
