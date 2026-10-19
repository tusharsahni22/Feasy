import { Router } from 'express';
import studentRoutes from './studentRoutes.js';
import classRoutes from './classRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reminderRoutes from './reminderRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'feasy-api', time: new Date().toISOString() })
);

router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reminders', reminderRoutes);
router.use('/settings', settingsRoutes);

export default router;
