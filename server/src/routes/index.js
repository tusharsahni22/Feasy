import { Router } from 'express';
import studentRoutes from './studentRoutes.js';
import classRoutes from './classRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reminderRoutes from './reminderRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import authRoutes from './authRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import userRoutes from './userRoutes.js';
import auditRoutes from './auditRoutes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'feasy-api', time: new Date().toISOString() })
);

// Public Auth routes
router.use('/auth', authRoutes);

// Protected Tenant-scoped routes
router.use('/students', requireAuth, studentRoutes);
router.use('/classes', requireAuth, classRoutes);
router.use('/subjects', requireAuth, subjectRoutes);
router.use('/payments', requireAuth, paymentRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/reminders', requireAuth, reminderRoutes);
router.use('/settings', requireAuth, settingsRoutes);
router.use('/workspaces', requireAuth, workspaceRoutes);
router.use('/users', requireAuth, userRoutes);
router.use('/audit-logs', requireAuth, auditRoutes);

export default router;
