import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { parseGeminiJSON } from '../utils/parse-gemini-json.js';
import { ENGLISH_PHONICS_CURRICULUM, KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { Storybook, GeneratePhonicsBookRequest, PhonicsBookType } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

/** 레벨 문자열에서 권 유형 파악 */
function getBookType(language: string, level: string): PhonicsBookType | undefined {
  if (language !== 'english') return undefined;
  const map: Record<string, PhonicsBookType> = {
    book1: 'letter-sounds',
    book2: 'short-vowels',
    book3: 'long-vowels',
    book4: 'blends-digraphs',
    book5: 'vowel-teams-r-controlled',
  };
  return map[level];
}

/** 권별 phonicsLesson 프롬프트 생성 지시 */
function buildLessonInstructions(bookType?: PhonicsBookType): string {
  switch (bookType) {
    case 'letter-sounds':
      return `3. **학습 콘텐츠 (phonicsLesson)**:
   - title: 유닛 주제 (예: "Letters Aa Bb Cc")
   - blending: 이 유닛에서는 블렌딩이 아닌 **글자별 소리 연습**을 제공합니다.
     각 타겟 글자마다 1개씩. vowel에 대문자(예:"A"), consonant에 소문자(예:"a"), blend에 음가 표기(예:"æ", 슬래쉬 없이), exampleWord에 대표 단어(예:"apple"), exampleWordImageDescription에 한글 이미지 설명(1-2문장).
     **illustrationDescription**: 파닉스 교재 삽화 장면을 한글 2-3문장으로 묘사합니다.
     **반드시** 다음 규칙을 지켜야 합니다:
     - 등장하는 것은 wordFamilies의 단어 **정확히 2개만** (동물 1 + 사물 1). 그 외 단어의 사물을 절대 추가하지 마세요.
     - **풍부한 배경** 필수: 공원, 학교 운동장, 과수원, 숲속 길, 집 앞 마당 등 구체적인 장소를 묘사. 하늘, 나무, 풀, 건물 등 배경 요소를 반드시 포함하세요.
     - 흰 배경, 단색 배경은 절대 금지.
     예: "친근한 악어가 작업복을 입고 햇살 가득한 과수원에서 커다란 빨간 사과를 들고 서 있습니다. 파란 하늘에 흰 구름이 떠 있고 초록 언덕 위로 사과나무가 늘어서 있습니다." (alligator + apple)
     예: "파란 셔츠를 입은 밝은 곰이 빨간 벽돌 학교 건물 앞 버스 정류장에서 손을 흔들고 있습니다. 단풍나무 가로수 사이로 노란 스쿨버스가 주차되어 있습니다." (bear + bus)
     예: "빨간 작업복을 입은 장난꾸러기 고양이가 아늑한 앞마당에서 호스로 보라색 자동차를 씻고 있습니다. 하얀 울타리와 알록달록한 꽃들, 작은 집이 배경에 있습니다." (cat + car)
   - wordFamilies: 각 글자마다 1개 그룹. pattern에 "Aa" 형태, words에 해당 글자로 시작하는 단어 **정확히 2개**. 각 단어에 korean(한글 뜻) 필수 포함.
     첫 번째 단어는 동물/캐릭터, 두 번째 단어는 사물로 선정하여 삽화에 자연스럽게 함께 등장하도록 합니다.
     예: {pattern:"Aa", words:[{word:"alligator",onset:"a",korean:"악어"}, {word:"apple",onset:"a",korean:"사과"}]}`;

    case 'blends-digraphs':
      return `3. **학습 콘텐츠 (phonicsLesson)**:
   - title: 유닛 주제 (예: "Blends: bl cl fl")
   - blending: 각 자음군/이중자음마다 1개. consonant에 자음군(예:"bl"), vowel에 대표 모음(예:"a"), blend에 조합(예:"bla"), exampleWord에 대표 단어 1(예:"black"), exampleWordImageDescription에 한글 이미지 설명(1-2문장), **exampleWord2**에 대표 단어 2(예:"blue"), **exampleWord2ImageDescription**에 한글 이미지 설명(1-2문장). 두 예시단어는 서로 다른 단어여야 합니다.
     **illustrationDescription**: 파닉스 교재 학습카드 이미지 묘사 (한글 2-3문장). 위쪽에 vowel+consonant→blend 구름 모양 블렌딩 공식, 아래쪽에 예시단어 2행(onset 노란칸 + blend 하늘칸 → 완성단어 + 작은 삽화). 구체적인 글자/단어/삽화 내용을 명시하세요.
   - wordFamilies: 각 자음군마다 1개 그룹, 각 그룹에 4개 단어. pattern에 자음군(예:"bl-"), onset에 자음군 전체.
     예: {pattern:"bl-", words:[{word:"black",onset:"bl"}, {word:"blade",onset:"bl"}, {word:"block",onset:"bl"}, {word:"blue",onset:"bl"}]}`;

    case 'vowel-teams-r-controlled':
      return `3. **학습 콘텐츠 (phonicsLesson)**:
   - title: 유닛 주제 (예: "Vowel Teams: ee ea")
   - blending: 각 모음 패턴마다 1개. vowel에 모음 패턴(예:"ee"), consonant에 대표 자음(예:"b"), blend에 조합(예:"bee"), exampleWord에 대표 단어 1(예:"bee"), exampleWordImageDescription에 한글 이미지 설명(1-2문장), **exampleWord2**에 대표 단어 2(예:"tree"), **exampleWord2ImageDescription**에 한글 이미지 설명(1-2문장). 두 예시단어는 서로 다른 단어여야 합니다.
     **illustrationDescription**: 파닉스 교재 학습카드 이미지 묘사 (한글 2-3문장). 위쪽에 vowel+consonant→blend 구름 모양 블렌딩 공식, 아래쪽에 예시단어 2행(onset 노란칸 + blend 하늘칸 → 완성단어 + 작은 삽화). 구체적인 글자/단어/삽화 내용을 명시하세요.
   - wordFamilies: 각 모음 패턴마다 1개 그룹, 각 그룹에 4-6개 단어. pattern에 모음 패턴명.
     예: {pattern:"ee", words:[{word:"bee",onset:"b"}, {word:"feet",onset:"f"}, {word:"tree",onset:"tr"}, {word:"green",onset:"gr"}]}`;

    // short-vowels, long-vowels, 한국어 등
    default:
      return `3. **학습 콘텐츠 (phonicsLesson)**:
   - title: 유닛 주제 (예: "Short Vowel a")
   - blending: 유닛의 각 패턴마다 1개 블렌딩 연습. vowel(모음) + consonant(자음) = blend(조합) → exampleWord(예시단어 1) + exampleWordImageDescription(한글 이미지 설명: 1-2문장) + **exampleWord2**(예시단어 2) + **exampleWord2ImageDescription**(한글 이미지 설명: 1-2문장). 두 예시단어는 서로 다른 단어여야 합니다.
     **illustrationDescription**: 파닉스 교재 학습카드 이미지 묘사 (한글 2-3문장). 위쪽에 vowel+consonant→blend 구름 모양 블렌딩 공식, 아래쪽에 예시단어 2행(onset 노란칸 + blend 하늘칸 → 완성단어 + 작은 삽화). 구체적인 글자/단어/삽화 내용을 명시하세요.
     예: {vowel:"a", consonant:"d", blend:"ad", exampleWord:"dad", exampleWordImageDescription:"다정한 아빠가 아이를 안아 올리고 있습니다", exampleWord2:"sad", exampleWord2ImageDescription:"슬픈 표정의 소녀가 고개를 숙이고 있습니다", illustrationDescription:"윗부분 하늘색 배경에 'a' 구름 + 'd' 구름 → 'ad' 구름. 아래 1행: 'd' 노란칸 + 'ad' 하늘칸(빨간글씨) → 'dad'(ad 빨간색) + 아빠가 아이를 안고있는 작은 삽화. 2행: 's' 노란칸 + 'ad' 하늘칸(빨간글씨) → 'sad'(ad 빨간색) + 슬픈 표정 소녀 작은 삽화."}
   - wordFamilies: 유닛의 각 패턴마다 1개 그룹, 각 그룹에 4개 단어. word(전체단어) + onset(앞 자음).
     예: {pattern:"-ad", words:[{word:"dad",onset:"d"}, {word:"sad",onset:"s"}, {word:"mad",onset:"m"}, {word:"bad",onset:"b"}]}`;
  }
}

/** 커리큘럼에서 유닛 정보 조회 */
function lookupUnit(language: 'korean' | 'english', level: string, unitId: string) {
  const curriculum =
    language === 'english' ? ENGLISH_PHONICS_CURRICULUM : KOREAN_PHONICS_CURRICULUM;
  const lvl = curriculum.find((l) => l.level === level);
  if (!lvl) throw new AppError(400, `유효하지 않은 레벨: ${level}`);
  const unit = lvl.units.find((u) => u.id === unitId);
  if (!unit) throw new AppError(400, `유효하지 않은 유닛: ${unitId}`);
  return { levelInfo: lvl, unit };
}

function buildPhonicsPrompt(
  req: GeneratePhonicsBookRequest,
  levelInfo: { name: string; description: string },
  unit: {
    title: string;
    phonemes: readonly string[];
    patterns: readonly string[];
    sampleWords: readonly string[];
  }
) {
  const { title, targetAge, language, level, storyTheme, referenceContent } = req;

  const bookType = getBookType(language, level);
  const isKorean = language === 'korean';
  const storyLang = isKorean ? '한국어' : '영어';
  const ageGuide =
    targetAge === '4-5'
      ? '4-5세: 페이지 8-10개, 문장 2-3개/페이지, 간단한 어휘'
      : targetAge === '5-7'
        ? '5-7세: 페이지 10-12개, 문장 3-4개/페이지, 중간 수준 어휘'
        : '7-8세: 페이지 12-14개, 문장 4-5개/페이지, 풍부한 어휘';

  const lessonInstructions = buildLessonInstructions(bookType);
  const includeFlashcards = true;

  return `
당신은 유아동 파닉스 교육 전문 작가입니다.
아래 커리큘럼 정보를 기반으로 파닉스 유닛의 모든 콘텐츠를 JSON으로 생성해주세요.

=== 커리큘럼 정보 ===
- 언어: ${storyLang}
- 레벨: ${levelInfo.name} — ${levelInfo.description}
- 유닛: ${unit.title}
- 타겟 음소: ${unit.phonemes.join(', ')}
- 타겟 패턴: ${unit.patterns.join(', ')}
- 타겟 단어: ${unit.sampleWords.join(', ')}

=== 생성 요청 ===
- 제목: ${title}
- 대상 연령: ${targetAge}세 (${ageGuide})
${storyTheme ? `- 동화 테마: ${storyTheme}` : ''}
${referenceContent ? `- 참고 내용: ${referenceContent}` : ''}

=== 핵심 규칙 ===
1. **스토리**: ${storyLang}로 작성.
   - 명확한 기승전결 구조를 갖춘 하나의 일관된 이야기를 만드세요. 캐릭터에게 목표/문제를 부여하고, 타겟 단어들이 그 과정에서 자연스럽게 등장하도록 하세요.
   - 각 페이지가 자연스럽게 다음 페이지로 이어져야 합니다. 장면 전환이 갑작스럽지 않도록 하세요.
   - 타겟 단어를 억지로 나열하지 말고, 스토리 전개 속에 자연스럽게 녹여내세요.
   - 각 타겟 단어는 최소 2회 반복.
   - 페이지 본문(text)에 마크다운 볼드(**단어**)를 사용하지 마세요. 순수 텍스트만 작성.
2. **캐릭터**: 스토리에 2페이지 이상 등장하는 캐릭터 설정 (외모 구체적으로).
${lessonInstructions}
  **중요: 학습카드 이미지 설명 규칙**
  - **illustrationDescription** (Level 1): 반드시 스토리의 캐릭터를 등장시키세요. 캐릭터가 단어 사물과 상호작용하는 풍부한 장면을 묘사.
    예: 스토리 주인공이 "토리"라는 토끼라면 → "토리가 빨간 모자(hat)를 쓰고 활짝 웃고 있습니다"
  - **illustrationDescription** (Level 2+): 유아 파닉스 교재 스타일 학습카드 이미지. 반드시 아래 레이아웃 구조를 따르세요:
    **윗부분(연한 하늘색 배경)**: vowel과 consonant가 각각 흰 구름 모양 안에 큰 글씨로, 사이에 '+' 기호, 화살표 '→' 뒤에 blend가 큰 구름 안에 표시.
    **아랫부분(흰 배경, 2행)**: 각 행에 onset이 노란 네모칸, blend가 하늘색 네모칸(빨간 글씨), 화살표 뒤에 완성 단어(blend 부분 빨간색), 오른쪽에 단어 뜻의 작은 귀여운 삽화.
    예: vowel=a, consonant=d, blend=ad, exampleWord=dad, exampleWord2=sad일 때 →
    "윗부분 하늘색 배경에 'a' 구름 + 'd' 구름 → 'ad' 구름. 아래 1행: 'd' 노란칸 + 'ad' 하늘칸(빨간글씨) → 'dad'(ad 빨간색) + 아빠가 아이를 안고있는 작은 삽화. 2행: 's' 노란칸 + 'ad' 하늘칸(빨간글씨) → 'sad'(ad 빨간색) + 슬픈 표정 소녀 작은 삽화."
  - **exampleWordImageDescription / exampleWord2ImageDescription**: 어휘 플래시카드용 설명. 단어가 뜻하는 대상 하나만 짧게 묘사 (5-10단어). 스토리 캐릭터 이름/배경/장면/다른 사물 절대 포함 금지.
    좋은 예: "can" → "빨간색 깡통", "dad" → "다정한 아빠", "sad" → "슬픈 표정의 소녀", "map" → "펼쳐진 보물지도"
    나쁜 예 (금지): "Foxy Fin이 깡통을 들여다보고 있습니다" (캐릭터 포함), "빨간 깡통 옆에 꽃들이 피어있습니다" (다른 사물 포함)
    **반드시 대상 1개만. 캐릭터, 배경, 부가 사물 포함 시 오류입니다.**
4. **챈트**: 4-8줄, 타겟 음가/단어를 반복하는 리듬감 있는 가사. highlightWords로 타겟 단어 표시.
${includeFlashcards ? '5. **플래시카드**: 타겟 단어마다 1개. word(영어), localWord(한글), phonemes(음소 분리), sentence(예문), imageDescription(이미지 설명: 한글로, 단어가 뜻하는 대상 하나만 짧게 묘사. 캐릭터/배경/다른사물 절대 불포함. 예: "빨간색 깡통", "다정한 아빠").' : '5. **플래시카드**: 생성하지 마세요. flashcards 배열은 빈 배열([])로 두세요.'}
6. **워크시트**: 최소 2개 (matching 1개 + fill-blank 1개). 각 워크시트에 4-6개 문항.
7. **퀴즈**: 5-8개 (sound-match, word-recognition, rhyme, phoneme-count 혼합).
8. **교육 콘텐츠**: 학습 어휘 6-8개, 이해 퀴즈 5개, 학습 목표, 교훈.
9. **표지 프롬프트**: 표지 이미지 설명 (한글, 2-3문장).

=== JSON 구조 ===
{
  "coverPrompt": "표지 이미지 설명 (한글, 2-3문장. 제목 텍스트 포함하지 말 것)",
  "characters": [
    {
      "name": "캐릭터 이름",
      "description": "캐릭터 상세 외모 설명 (한글)",
      "descriptionEn": "Same appearance in English (specific: hair/eye/outfit)",
      "age": 나이,
      "role": "주인공|조력자|조연",
      "height": 상대적높이(50-200),
      "heightCm": 실제키cm
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "페이지 본문 (${storyLang})",
      "scene_description": "장면 설명 (한글, 2-3문장. 구체적이고 시각적으로 묘사)",
      "scene_structure": {
        "characters": "등장 캐릭터와 행동 (한글)",
        "background": "배경 묘사 (한글)",
        "atmosphere": "분위기 (한글)"
      },
      "key_objects": "이 페이지의 중요 사물들"
    }
  ],
  "chant": {
    "title": "챈트 제목",
    "lyrics": [
      { "text": "가사 한 줄", "highlightWords": ["타겟단어1", "타겟단어2"] }
    ],
    "bpm": 120,
    "tone": "cheerful"
  },
  "flashcards": [
    {
      "word": "영어단어",
      "localWord": "한글뜻",
      "phonemes": ["c", "a", "t"],
      "phonicPattern": "_at",
      "sentence": "예문 (${storyLang})",
      "imageDescription": "친근한 주황색 고양이가 빨간 매트 위에 앉아 밝은 초록 눈으로 올려다보고 있습니다 (한글, 1-2문장으로 단어를 시각적으로 묘사)"
    }
  ],
  "worksheets": [
    {
      "type": "matching",
      "title": "워크시트 제목",
      "instructions": "문제 지시문",
      "items": [
        { "prompt": "문제", "answer": "정답", "options": ["보기1", "보기2", "보기3"] }
      ]
    }
  ],
  "phonicsQuiz": [
    {
      "question": "문제 (${storyLang})",
      "questionType": "sound-match",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "correctAnswer": 0,
      "targetPhoneme": "타겟 음소",
      "targetWord": "타겟 단어",
      "difficulty": "easy"
    }
  ],
  "phonicsLesson": {
    "title": "유닛 학습 주제 (예: Short Vowel a)",
    "blending": [
      { "vowel": "a", "consonant": "n", "blend": "an", "exampleWord": "can", "exampleWordImageDescription": "빨간색 깡통 하나", "exampleWord2": "fan", "exampleWord2ImageDescription": "알록달록한 접이식 부채", "illustrationDescription": "윗부분 하늘색 배경에 'a' 구름 + 'n' 구름 → 'an' 구름. 아래 1행: 'c' 노란칸 + 'an' 하늘칸(빨간글씨) → 'can'(an 빨간색) + 빨간 깡통 작은 삽화. 2행: 'f' 노란칸 + 'an' 하늘칸(빨간글씨) → 'fan'(an 빨간색) + 접이식 부채 작은 삽화." },
      { "vowel": "a", "consonant": "t", "blend": "at", "exampleWord": "bat", "exampleWordImageDescription": "귀여운 갈색 박쥐", "exampleWord2": "cat", "exampleWord2ImageDescription": "귀여운 주황색 고양이", "illustrationDescription": "윗부분 하늘색 배경에 'a' 구름 + 't' 구름 → 'at' 구름. 아래 1행: 'b' 노란칸 + 'at' 하늘칸(빨간글씨) → 'bat'(at 빨간색) + 귀여운 박쥐 작은 삽화. 2행: 'c' 노란칸 + 'at' 하늘칸(빨간글씨) → 'cat'(at 빨간색) + 주황색 고양이 작은 삽화." }
    ],
    "wordFamilies": [
      {
        "pattern": "-an",
        "words": [
          { "word": "can", "onset": "c" },
          { "word": "fan", "onset": "f" },
          { "word": "man", "onset": "m" },
          { "word": "pan", "onset": "p" }
        ]
      }
    ]
  },
  "educational_content": {
    "vocabulary": [
      { "word": "영단어", "korean": "한글 뜻", "definition": "영어 정의", "example": "예문" }
    ],
    "quiz": [
      { "question": "이해 퀴즈 (한글)", "options": ["보기1", "보기2", "보기3", "보기4"], "correctAnswer": 0 }
    ],
    "learning_objectives": ["학습 목표1", "학습 목표2"],
    "moral_lesson": "교훈"
  },
  "key_objects": [
    { "name": "사물 영어 이름", "korean": "한글 이름", "description": "사물 시각적 특징 (한글)", "pages": [1, 3], "sizeCm": 크기cm, "sizeCategory": "small|medium|large" }
  ]
}

요구사항:
- JSON만 응답 (다른 텍스트 없이)
- 저작권이 있는 캐릭터명/디자인 절대 사용 금지
- 캐릭터 description은 한글과 영어(descriptionEn) 모두 작성. 이미지 설명(scene_description, exampleWordImageDescription, illustrationDescription, imageDescription)은 모두 한글로 작성
`.trim();
}

export const PhonicsService = {
  async generate(req: GeneratePhonicsBookRequest): Promise<Storybook> {
    const { title, targetAge, artStyle, language, level, unitId, referenceContent, model } = req;
    const { levelInfo, unit } = lookupUnit(language, level, unitId);

    const prompt = buildPhonicsPrompt(req, levelInfo, unit);
    const raw = await generateTextWithGemini(prompt, 3, model);
    const parsed = parseGeminiJSON<Partial<Storybook>>(raw, 'AI 응답을 파싱하는데 실패했습니다.');

    const storybook: Storybook = {
      id: Date.now().toString(),
      type: 'phonics',
      title,
      targetAge,
      artStyle,
      referenceContent,
      createdAt: new Date().toISOString(),
      // 기본 콘텐츠
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
      // 파닉스 전용
      phonicsConfig: {
        language,
        level,
        targetUnit: unit.title,
        targetPhonemes: [...unit.phonemes],
        targetWords: [...unit.sampleWords],
        targetPatterns: [...unit.patterns],
        bookType: getBookType(language, level),
      },
      phonicsLesson: parsed.phonicsLesson,
      chant: parsed.chant,
      flashcards: parsed.flashcards ?? [],
      worksheets: parsed.worksheets ?? [],
      phonicsQuiz: parsed.phonicsQuiz ?? [],
    };

    return R2Repository.saveStorybook(storybook);
  },
};
