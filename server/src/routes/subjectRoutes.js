import { Router } from 'express';
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';

const router = Router();

router.route('/').get(listSubjects).post(createSubject);
router.route('/:id').put(updateSubject).delete(deleteSubject);

export default router;
