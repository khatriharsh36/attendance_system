import express from 'express';
import {
  getTimetable,
  createTimetableSlot,
  deleteTimetableSlot,
} from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('hod'), createTimetableSlot);
router.delete('/:id', authorize('hod'), deleteTimetableSlot);

export default router;
