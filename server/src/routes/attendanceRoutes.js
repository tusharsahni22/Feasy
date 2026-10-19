import { Router } from 'express';
import {
  scanAttendance,
  getAttendance,
  manualAttendance,
  bulkAttendance,
  updateCheckOut,
} from '../controllers/attendanceController.js';

const router = Router();

router.post('/scan', scanAttendance);
router.get('/', getAttendance);
router.post('/manual', manualAttendance);
router.post('/bulk', bulkAttendance);
router.patch('/:id/checkout', updateCheckOut);

export default router;

