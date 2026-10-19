import { Router } from 'express';
import {
  getSettingsHandler,
  updateSettingsHandler,
} from '../controllers/settingsController.js';

const router = Router();

router.route('/').get(getSettingsHandler).put(updateSettingsHandler);

export default router;
