import { apiPost } from '@/lib/axios';
import type { QuizItem } from '@tangobook/shared';

interface GenerateQuizRequest {
  storyTitle: string;
  pages: Array<{ text: string }>;
  difficulty: 'easy' | 'medium' | 'hard';
  count?: number;
}

export const quizApi = {
  generate: (req: GenerateQuizRequest) => apiPost<QuizItem[]>('/quiz/generate', req),
};
