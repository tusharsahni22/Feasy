import { Router } from 'express';
import {
  listClasses,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';

const router = Router();

router.route('/').get(listClasses).post(createClass);
router.route('/:id').put(updateClass).delete(deleteClass);

export default router;
