import { generateTextWithGemini } from '../providers/gemini.provider.js';
import type { QuizItem } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

interface QuizRequest {
  storyTitle: string;
  pages: Array<{ text: string }>;
  difficulty: 'easy' | 'medium' | 'hard';
  count?: number;
}

export const QuizService = {
  async generate(req: QuizRequest): Promise<QuizItem[]> {
    const { storyTitle, pages, difficulty, count = 5 } = req;

    const storyText = pages.map((p, i) => `페이지 ${i + 1}: ${p.text}`).join('\n');

    const prompt = `다음 동화책 스토리를 읽고 어린이 퀴즈를 ${count}개 생성해주세요.

제목: ${storyTitle}
난이도: ${difficulty === 'easy' ? '쉬움 (4-5세)' : difficulty === 'medium' ? '보통 (5-7세)' : '어려움 (7-8세)'}

스토리:
${storyText}

JSON 배열 형식으로 응답:
[
  {
    "question": "질문 (한글)",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "correctAnswer": 0
  }
]

JSON만 응답하세요.`;

    const raw = await generateTextWithGemini(prompt);

    try {
      const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/(\[[\s\S]*\])/);
      return JSON.parse(jsonMatch?.[1] ?? raw) as QuizItem[];
    } catch {
      throw new AppError(500, '퀴즈 생성 결과를 파싱하는데 실패했습니다.');
    }
  },
};
