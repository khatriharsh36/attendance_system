import express from 'express';
import {
  submitCorrectionRequest,
  getStudentCorrectionRequests,
  getFacultyCorrectionRequests,
  reviewCorrectionRequest,
} from '../controllers/correctionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('student'), submitCorrectionRequest);
router.get('/student', authorize('student'), getStudentCorrectionRequests);
router.get('/faculty', authorize('faculty', 'hod'), getFacultyCorrectionRequests);
router.patch('/:id', authorize('faculty', 'hod'), reviewCorrectionRequest);

export default router;
