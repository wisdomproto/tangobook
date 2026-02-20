import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { parseGeminiJSON } from '../utils/parse-gemini-json.js';
import type {
  Storybook,
  StorybookSummary,
  GenerateStorybookRequest,
  GenerateStoryRequest,
  StoryDraftPage,
} from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_GUIDE = fs.readFileSync(path.resolve(__dirname, '../../prompt_guide.md'), 'utf-8');

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

  async generateStory(req: GenerateStoryRequest): Promise<StoryDraftPage[]> {
    const { title, targetAge, referenceContent, model } = req;

    const prompt = buildStoryOnlyPrompt(title, targetAge, referenceContent);
    const raw = await generateTextWithGemini(prompt, 3, model);
    const parsed = parseGeminiJSON<{ pages: StoryDraftPage[] }>(
      raw,
      'AI 응답을 파싱하는데 실패했습니다.'
    );
    return parsed.pages ?? [];
  },

  async generate(req: GenerateStorybookRequest): Promise<Storybook> {
    const { title, targetAge, artStyle, referenceContent, draftPages, model } = req;

    const prompt = draftPages?.length
      ? buildStorybookFromDraftPrompt(title, targetAge, artStyle, draftPages, referenceContent)
      : buildStorybookPrompt(title, targetAge, artStyle, referenceContent);
    const raw = await generateTextWithGemini(prompt, 3, model);
    const parsed = parseGeminiJSON<Partial<Storybook>>(raw, 'AI 응답을 파싱하는데 실패했습니다.');

    // draftPages가 있으면 사용자가 확정한 텍스트를 유지
    const pages = parsed.pages ?? [];
    if (draftPages?.length) {
      for (const page of pages) {
        const draft = draftPages.find((d) => d.pageNumber === page.pageNumber);
        if (draft) page.text = draft.text;
      }
    }

    const storybook: Storybook = {
      id: Date.now().toString(),
      title,
      targetAge,
      artStyle,
      referenceContent,
      createdAt: new Date().toISOString(),
      characters: parsed.characters ?? [],
      pages,
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

function buildStoryOnlyPrompt(title: string, targetAge: string, referenceContent?: string): string {
  return `
당신은 유아동 교육 동화책 전문 작가입니다. 아래의 "프롬프트 가이드"를 철저히 따라 동화책의 **페이지 텍스트와 장면 설명**을 생성해주세요.

=== 프롬프트 가이드 ===
${PROMPT_GUIDE}
=== 프롬프트 가이드 끝 ===

생성 요청 정보:
- 제목: ${title}
- 대상 연령: ${targetAge}세
${referenceContent ? `- 참고 내용: ${referenceContent}` : ''}

위 프롬프트 가이드의 "${targetAge}세" 연령 기준을 반드시 따르세요:
- 해당 연령의 문장 길이, 어절 수, 어휘 수준을 준수
- 종결어미 규칙(~했어, ~었어, ~구나! 등) 사용, 금지 종결어미(~했습니다, ~하다) 절대 미사용
- 의성어/의태어를 적극 활용
- 3막 구조(설정→전개→결말) 반드시 적용
- 대화(30-40%)와 서술(60-70%) 비율 준수

다음 JSON 구조로 응답해주세요:
{
  "pages": [
    { "pageNumber": 1, "text": "페이지 본문 (한글)", "scene_description": "삽화를 위한 장면 설명 (한글, 2-3문장. 캐릭터 행동/표정, 배경, 분위기 포함)" },
    { "pageNumber": 2, "text": "페이지 본문 (한글)", "scene_description": "장면 설명 (한글)" }
  ]
}

요구사항:
- 페이지 수: 가이드의 연령별 페이지 수 준수 (${targetAge}세 기준)
- 각 페이지 텍스트는 가이드의 연령별 문장 수/어절 수를 준수
- **한 페이지 = 한 장면**: 각 페이지 텍스트는 하나의 장면만 묘사. 장면이 바뀌면 반드시 새 페이지로 분리. 한 페이지에 2개 이상의 장면을 합치지 말 것.
- scene_description은 한글로 작성. 삽화에 그려질 장면을 구체적이고 시각적으로 묘사 (캐릭터 행동/표정, 배경, 분위기)
- JSON만 응답 (다른 텍스트 없이)
`.trim();
}

function buildStorybookFromDraftPrompt(
  title: string,
  targetAge: string,
  artStyle: string,
  draftPages: StoryDraftPage[],
  referenceContent?: string
): string {
  const pagesText = draftPages
    .map((p) => {
      let line = `[페이지 ${p.pageNumber}] ${p.text}`;
      if (p.scene_description) line += `\n  장면: ${p.scene_description}`;
      return line;
    })
    .join('\n');

  return `
당신은 유아동 교육 동화책 전문 작가입니다. 사용자가 확정한 페이지 텍스트를 기반으로 캐릭터, 장면 설명, 교육 콘텐츠를 생성해주세요.

=== 프롬프트 가이드 ===
${PROMPT_GUIDE}
=== 프롬프트 가이드 끝 ===

생성 요청 정보:
- 제목: ${title}
- 대상 연령: ${targetAge}세
- 그림체: ${artStyle}
${referenceContent ? `- 참고 내용: ${referenceContent}` : ''}

=== 사용자 확정 페이지 텍스트 ===
${pagesText}
=== 텍스트 끝 ===

위 페이지 텍스트와 장면 설명을 기반으로 다음을 생성해주세요:
1. 캐릭터: 텍스트에 2페이지 이상 등장하는 모든 캐릭터의 외모/성격 설정. 그룹 캐릭터(예: 난쟁이들, 언니들)는 반드시 개별로 분리 (난쟁이1, 난쟁이2... / 큰언니, 작은언니 등). 수 제한 없음.
2. 장면 설명: 각 페이지의 삽화를 위한 한글 scene_description (사용자가 제공한 장면 설명이 있으면 그것을 기반으로 보강/개선)
3. 교육 콘텐츠: 어휘, 퀴즈, 학습 목표, 교훈
4. 핵심 사물: 스토리에 등장하는 중요 사물들
5. 표지 프롬프트: 표지 이미지 설명

중요: 각 페이지의 "text" 필드는 위에 제공된 사용자 확정 텍스트를 그대로 사용하세요. 수정하지 마세요.

다음 JSON 구조로 응답해주세요:
{
  "coverPrompt": "표지 이미지 설명 (한글, 2-3문장. 제목 텍스트 포함하지 말 것)",
  "characters": [
    {
      "name": "캐릭터 이름 (한글)",
      "description": "캐릭터 상세 외모 설명 (영어, 이미지 생성용. 디즈니 등 유명 캐릭터와 다른 독창적 외모 디자인. 고유명사/상징적 디자인 조합 금지)",
      "age": 나이(숫자),
      "role": "주인공|조력자|악역|조연",
      "height": 상대적높이(50-200사이숫자),
      "heightCm": 실제키cm
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "사용자 확정 텍스트 그대로",
      "scene_description": "장면 설명 (한글, 2-3문장. 캐릭터 행동/표정, 배경, 분위기 포함)",
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
      { "question": "질문 (한글)", "options": ["보기1", "보기2", "보기3", "보기4"], "correctAnswer": 0 }
    ],
    "learning_objectives": ["학습 목표1 (한글)", "학습 목표2"],
    "moral_lesson": "이야기의 교훈 (한글)"
  },
  "key_objects": [
    { "name": "사물 이름 (영어)", "korean": "한글 이름", "description": "사물 시각적 특징 상세 묘사 (한글, 색상/재질/크기/장식 등)", "pages": [1, 3], "sizeCm": 실제크기cm, "sizeCategory": "small|medium|large" }
  ]
}

요구사항:
- 페이지 수: 사용자 확정 텍스트와 동일한 ${draftPages.length}페이지
- 캐릭터: 2페이지 이상 등장하는 모든 캐릭터 포함 (수 제한 없음). 그룹 캐릭터는 개별 분리 (예: 일곱 난쟁이 → 난쟁이1~7, 의붓언니들 → 큰언니/작은언니)
- **저작권 회피 (매우 중요)**: characters의 description(영어)에 디즈니/픽사/지브리 등 유명 캐릭터의 고유명사(Cinderella, Snow White 등)를 절대 포함하지 마세요. 또한 유명 캐릭터의 상징적 외모 조합(금발+하늘색드레스+유리구두 등)을 피하고, 원작 동화의 배경을 살리되 완전히 독창적인 외모/의상을 디자인하세요. coverPrompt와 scene_description에서도 고유명사 대신 외모 묘사로 캐릭터를 지칭하세요.
- 학습 단어: 6-8개
- 퀴즈: 5개
- key_objects는 반드시 동화책에 등장하는 사물(명사)만 선정. 인물/대명사/추상명사 절대 불가. 5-8개 선정.
- JSON만 응답
`.trim();
}

function buildStorybookPrompt(
  title: string,
  targetAge: string,
  artStyle: string,
  referenceContent?: string
): string {
  return `
당신은 유아동 교육 동화책 전문 작가입니다. 아래의 "프롬프트 가이드"를 철저히 따라 동화책을 JSON 형식으로 생성해주세요.

=== 프롬프트 가이드 ===
${PROMPT_GUIDE}
=== 프롬프트 가이드 끝 ===

생성 요청 정보:
- 제목: ${title}
- 대상 연령: ${targetAge}세
- 그림체: ${artStyle}
${referenceContent ? `- 참고 내용: ${referenceContent}` : ''}

위 프롬프트 가이드의 "${targetAge}세" 연령 기준을 반드시 따르세요:
- 해당 연령의 문장 길이, 어절 수, 어휘 수준을 준수
- 종결어미 규칙(~했어, ~었어, ~구나! 등) 사용, 금지 종결어미(~했습니다, ~하다) 절대 미사용
- 의성어/의태어를 적극 활용
- 3막 구조(설정→전개→결말) 반드시 적용
- 대화(30-40%)와 서술(60-70%) 비율 준수

다음 JSON 구조로 응답해주세요:
{
  "coverPrompt": "표지 이미지 설명 (한글, 2-3문장. 제목 텍스트 포함하지 말 것)",
  "characters": [
    {
      "name": "캐릭터 이름 (한글)",
      "description": "캐릭터 상세 외모 설명 (영어, 머리색/눈색/체형/의상 등 구체적으로. 이미지 생성용. 디즈니 등 유명 캐릭터와 다른 독창적 외모 디자인. 고유명사/상징적 디자인 조합 금지)",
      "age": 나이(숫자),
      "role": "주인공|조력자|악역|조연",
      "height": 상대적높이(50-200사이숫자),
      "heightCm": 실제키cm(예:어린이110,성인170,난쟁이90,거인300)
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "페이지 본문 (한글, 가이드의 연령별 문장 수/어절 수 준수)",
      "scene_description": "장면 설명 (한글, 2-3문장. 캐릭터 행동/표정, 배경, 분위기 포함)",
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
      { "question": "질문 (한글)", "options": ["보기1", "보기2", "보기3", "보기4"], "correctAnswer": 0 }
    ],
    "learning_objectives": ["학습 목표1 (한글)", "학습 목표2"],
    "moral_lesson": "이야기의 교훈 (한글, 직접적 설교 대신 자연스러운 문장)"
  },
  "key_objects": [
    { "name": "사물 이름 (영어)", "korean": "한글 이름", "description": "사물 시각적 특징 상세 묘사 (한글, 색상/재질/크기/장식 등)", "pages": [1, 3], "sizeCm": 실제크기cm(예:사과8,거울50,성150,꽃15), "sizeCategory": "small|medium|large" }
  ]
}

요구사항:
- 페이지 수: 가이드의 연령별 페이지 수 준수
- 한 페이지 = 한 장면: 각 페이지 텍스트는 하나의 장면만 묘사. 장면이 바뀌면 반드시 새 페이지로 분리.
- 캐릭터: 2페이지 이상 등장하는 모든 캐릭터 포함 (수 제한 없음). 그룹 캐릭터는 개별 분리 (예: 일곱 난쟁이 → 난쟁이1~7, 의붓언니들 → 큰언니/작은언니)
- **저작권 회피 (매우 중요)**: characters의 description(영어)에 디즈니/픽사/지브리 등 유명 캐릭터의 고유명사(Cinderella, Snow White 등)를 절대 포함하지 마세요. 또한 유명 캐릭터의 상징적 외모 조합(금발+하늘색드레스+유리구두 등)을 피하고, 원작 동화의 배경을 살리되 완전히 독창적인 외모/의상을 디자인하세요. coverPrompt와 scene_description에서도 고유명사 대신 외모 묘사로 캐릭터를 지칭하세요.
- 학습 단어: 6-8개 (스토리 핵심 단어, 명사 중심)
- 퀴즈: 5개 (이해도 확인 + 감정/동기 추론 + 교훈 관련)
- scene_description은 한글로 작성. 삽화에 그려질 장면을 구체적이고 시각적으로 묘사 (캐릭터 행동/표정, 배경, 분위기)
- characters의 description은 캐릭터 이미지 생성에 사용되므로 외모를 매우 구체적으로 작성 (영어)
- key_objects는 반드시 동화책에 등장하는 사물(명사)만 선정. 인물/대명사/추상명사 절대 불가. 5-8개 선정.
- JSON만 응답 (다른 텍스트 없이)
`.trim();
}
