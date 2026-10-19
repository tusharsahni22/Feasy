import { Router } from 'express';
import {
  listTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listTeamMembers);
router.post('/', requireAuth, addTeamMember);
router.put('/:id', requireAuth, updateTeamMember);
router.delete('/:id', requireAuth, deleteTeamMember);

export default router;

