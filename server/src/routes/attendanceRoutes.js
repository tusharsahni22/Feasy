import { Router } from 'express';
import {
  scanAttendance,
  getAttendance,
  manualAttendance,
  bulkAttendance,
  updateCheckOut,
  getTenantCheckInInfo,
  selfCheckIn,
} from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes (Students scan desk QR without employee login)
router.get('/public/info/:slug', getTenantCheckInInfo);
router.post('/public/checkin/:slug', selfCheckIn);

// Protected routes (Requires workspace login)
router.post('/scan', requireAuth, scanAttendance);
router.get('/', requireAuth, getAttendance);
router.post('/manual', requireAuth, manualAttendance);
router.post('/bulk', requireAuth, bulkAttendance);
router.patch('/:id/checkout', requireAuth, updateCheckOut);

export default router;

