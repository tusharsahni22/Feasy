import { Router } from 'express';
import { listWorkspaces, deleteWorkspace } from '../controllers/workspaceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listWorkspaces);
router.delete('/:id', requireAuth, deleteWorkspace);

export default router;

