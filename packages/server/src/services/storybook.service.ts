import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import type { Storybook, StorybookSummary, GenerateStorybookRequest } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

export const StorybookService = {
  async list(): Promise<StorybookSummary[]> {
    return R2Repository.listStorybooks();
  },

  async getById(id: string): Promise<Storybook | null> {
    return R2Repository.getStorybook(id);
  },

  async save(storybook: Storybook): Promise<Storybook> {
    if (!storybook.id) throw new AppError(400, '동화책 ID가 없습니다.');
    return R2Repository.saveStorybook(storybook);
  },

  async delete(id: string): Promise<void> {
    const storybook = await R2Repository.getStorybook(id);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');
    await R2Repository.deleteStorybook(id);
  },

  async generate(req: GenerateStorybookRequest): Promise<Storybook> {
    const { title, targetAge, artStyle, referenceContent } = req;

    const prompt = buildStorybookPrompt(title, targetAge, artStyle, referenceContent);
    const raw = await generateTextWithGemini(prompt);

    let parsed: Partial<Storybook>;
    try {
      const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch?.[1] ?? raw);
    } catch {
      throw new AppError(500, 'AI 응답을 파싱하는데 실패했습니다.');
    }

    const storybook: Storybook = {
      id: Date.now().toString(),
      title,
      targetAge,
      artStyle,
      referenceContent,
      createdAt: new Date().toISOString(),
      characters: parsed.characters ?? [],
      pages: parsed.pages ?? [],
      educational_content: parsed.educational_content ?? {
        vocabulary: [],
        quiz: [],
        learning_objectives: [],
        moral_lesson: '',
      },
      key_objects: parsed.key_objects ?? [],
      coverPrompt: parsed.coverPrompt,
    };

    return R2Repository.saveStorybook(storybook);
  },
};

function buildStorybookPrompt(
  title: string,
  targetAge: string,
  artStyle: string,
  referenceContent?: string
): string {
  return `
당신은 창의적인 동화책 작가입니다. 다음 정보를 바탕으로 어린이 동화책을 JSON 형식으로 생성해주세요.

제목: ${title}
대상 연령: ${targetAge}세
그림체: ${artStyle}
${referenceContent ? `참고 내용: ${referenceContent}` : ''}

다음 JSON 구조로 응답해주세요:
{
  "coverPrompt": "표지 이미지 설명 (영어, 2-3문장)",
  "characters": [
    {
      "name": "캐릭터 이름",
      "description": "캐릭터 상세 설명 (영어, 외모/성격 포함)",
      "age": 나이(숫자),
      "role": "주인공|조력자|악역|조연",
      "height": 150
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "페이지 본문 (한글, 2-4문장)",
      "scene_description": "장면 설명 (영어, 이미지 생성용)",
      "scene_structure": {
        "characters": "등장 캐릭터와 행동 (한글)",
        "background": "배경 묘사 (한글)",
        "atmosphere": "분위기 (한글)"
      },
      "key_objects": "이 페이지의 중요 사물들 (한글)"
    }
  ],
  "educational_content": {
    "vocabulary": [
      { "word": "영단어", "korean": "한글 뜻", "definition": "영어 정의", "example": "영어 예문" }
    ],
    "quiz": [
      { "question": "질문", "options": ["보기1", "보기2", "보기3", "보기4"], "correctAnswer": 0 }
    ],
    "learning_objectives": ["학습 목표1", "학습 목표2"],
    "moral_lesson": "이야기의 교훈 (한글)"
  },
  "key_objects": [
    { "name": "사물 이름 (한글)", "description": "사물 설명 (영어)", "pages": [1, 3] }
  ]
}

요구사항:
- 페이지 수: 10-12페이지
- 캐릭터 수: 3-5명
- 학습 단어: 8개
- 퀴즈: 5개
- 대상 연령(${targetAge}세)에 적합한 언어와 내용
- 교육적이고 따뜻한 교훈 포함
- JSON만 응답 (다른 텍스트 없이)
`.trim();
}
