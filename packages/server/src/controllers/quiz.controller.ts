import { QuizService } from '../services/quiz.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const QuizController = {
  generate: asyncHandler(async (req, res) => {
    const quiz = await QuizService.generate(req.body);
    res.json({ success: true, data: quiz });
  }),
};
