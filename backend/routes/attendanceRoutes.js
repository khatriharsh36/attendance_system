import express from 'express';
import {
  markAttendance,
  getSessionAttendance,
  updateSingleAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('faculty', 'hod'), markAttendance);
router.get('/session/:sessionId', getSessionAttendance);
router.put('/:id', authorize('faculty', 'hod'), updateSingleAttendance);

export default router;
