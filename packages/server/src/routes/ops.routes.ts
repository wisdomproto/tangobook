import { Router } from 'express';
import { OpsController } from '../controllers/ops.controller.js';

const router = Router();

router.get('/overview', OpsController.getOverview);

export default router;
