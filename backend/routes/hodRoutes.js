import express from 'express';
import {
  getHODDashboard,
  getDepartmentStudents,
  getDepartmentFaculty,
  getShortageReport,
  getAuditLogs,
  updateDepartmentThreshold,
} from '../controllers/hodController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('hod'));

router.get('/dashboard', getHODDashboard);
router.get('/students', getDepartmentStudents);
router.get('/faculty', getDepartmentFaculty);
router.get('/shortage-report', getShortageReport);
router.get('/audit-logs', getAuditLogs);
router.patch('/threshold', updateDepartmentThreshold);

export default router;
