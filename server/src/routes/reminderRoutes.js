import { Router } from 'express';
import { sendReminders, listReminders } from '../controllers/reminderController.js';

const router = Router();

router.get('/', listReminders);
router.post('/send', sendReminders);

export default router;
