import { Router } from 'express';
import {
  listPayments,
  createPayment,
  deletePayment,
} from '../controllers/paymentController.js';

const router = Router();

router.route('/').get(listPayments).post(createPayment);
router.delete('/:id', deletePayment);

export default router;
