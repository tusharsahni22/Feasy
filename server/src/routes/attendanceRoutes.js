import { Router } from 'express';
import { scanAttendance, getAttendance, manualAttendance } from '../controllers/attendanceController.js';

const router = Router();

router.post('/scan', scanAttendance);
router.get('/', getAttendance);
router.post('/manual', manualAttendance);

export default router;
