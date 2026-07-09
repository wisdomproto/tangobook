import { Router } from 'express';
import { OpsController } from '../controllers/ops.controller.js';
import { MembersController } from '../controllers/members.controller.js';
import { opsAuth } from '../middleware/ops-auth.middleware.js';

const router = Router();

router.get('/overview', opsAuth, OpsController.getOverview);

router.get('/members', opsAuth, MembersController.list);
router.get('/members/:accountId', opsAuth, MembersController.detail);
router.post('/members/:accountId/grant', opsAuth, MembersController.grant);
router.post('/members/:accountId/ban', opsAuth, MembersController.ban);
router.delete('/members/:accountId', opsAuth, MembersController.remove);

export default router;
