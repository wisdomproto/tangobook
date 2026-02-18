import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';

const router = Router();

router.post('/generate', QuizController.generate);

export default router;
