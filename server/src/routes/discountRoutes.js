import { Router } from 'express';
import { getDiscounts, createDiscount, validateDiscount, toggleDiscount } from '../controllers/discountController.js';

const router = Router();

router.get('/', getDiscounts);
router.post('/', createDiscount);
router.post('/validate', validateDiscount);
router.patch('/:id/toggle', toggleDiscount);

export default router;

