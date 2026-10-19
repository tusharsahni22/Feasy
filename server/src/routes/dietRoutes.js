import { Router } from 'express';
import { updateStudentDiet, bulkUploadDiet, sendDietPlan, bulkSendDiet } from '../controllers/dietController.js';

const router = Router();

router.put('/student/:id', updateStudentDiet);
router.post('/bulk-upload', bulkUploadDiet);
router.post('/send/:id', sendDietPlan);
router.post('/bulk-send', bulkSendDiet);

export default router;

