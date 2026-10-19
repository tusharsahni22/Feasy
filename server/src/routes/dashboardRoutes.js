import { Router } from 'express';
import {
  getSummary,
  getCharts,
  getExpiring,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/expiring', getExpiring);

export default router;
