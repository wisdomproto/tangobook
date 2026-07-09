import { Router } from 'express';
import { OpsController } from '../controllers/ops.controller.js';
import { opsAuth } from '../middleware/ops-auth.middleware.js';

const router = Router();

router.get('/overview', opsAuth, OpsController.getOverview);

export default router;
