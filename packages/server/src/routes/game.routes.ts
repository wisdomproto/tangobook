import { Router } from 'express';
import { GameController } from '../controllers/game.controller.js';

const router = Router();

router.post('/generate', GameController.generate);

export default router;
