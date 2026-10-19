import { Router } from 'express';
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { getStudentPayments } from '../controllers/paymentController.js';

const router = Router();

router.route('/').get(listStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);
router.get('/:id/payments', getStudentPayments);

export default router;
