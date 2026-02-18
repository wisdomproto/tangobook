import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz.service.js';

export const QuizController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const quiz = await QuizService.generate(req.body);
      res.json({ success: true, data: quiz });
    } catch (err) {
      next(err);
    }
  },
};
