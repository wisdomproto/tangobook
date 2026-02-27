# TangoBook - 동화책 저작도구 PRD

## Document Info
- **Version**: 1.0
- **Date**: 2026-02-23
- **Status**: Phase 2-3 완료 (구현됨)
- **Master PRD**: [PRD_00_Master.md](PRD_00_Master.md)
- **UI/UX 스펙**: [PRD_UIUX_AuthorTool.md](PRD_UIUX_AuthorTool.md)

---

## 1. Overview

AI를 활용하여 비전문가도 고품질 동화책을 제작할 수 있는 웹 기반 저작도구.
크리에이터, 교사, 학부모가 버튼 몇 번으로 동화책 삽화, 텍스트, TTS를 생성하고
다양한 언어로 번역하여 콘텐츠를 발행할 수 있습니다.

**제작 효율**: AI로 3분 만에 동화책 1권 완성, 시간당 20권 생산 가능

---

## 2. Features (구현 완료)

### 2.1 동화책 생성 (AI Story Generation) ✅

**입력**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | Y | 동화책 제목 |
| targetAge | enum | Y | '3-4' / '4-5' / '5-7' / '7-8' |
| artStyle | string | Y | 7가지 프리셋 + 커스텀 입력 |
| language | string | Y | 기본 언어 |
| referenceContent | string | N | 참고할 스토리 내용 |
| pageCount | number | N | 페이지 수 (기본 10-12) |

**AI 자동 생성 결과**
- 10-12페이지 스토리 (연령별 맞춤 어휘/문장 난이도)
- 3-8명 캐릭터 (이름, 설명, 역할, 나이)
- 페이지별 구조화된 장면 설명
- 8개 이상 핵심 어휘 (영어+한글)
- Key Objects (핵심 사물)
- 5-10개 퀴즈

**그림체 프리셋**: 현대 일러스트 / 수채화 / 카툰 / 전통 동화책 / 애니메이션 / 유화 / 연필 스케치 / 커스텀

### 2.2 캐릭터 레퍼런스 시스템 ✅

- CRUD: 캐릭터 추가, 수정, 삭제
- 필드: 이름, 설명(영어), 나이, 역할, 키(50-250px)
- 프롬프트 커스터마이징
- 멀티뷰 레이아웃: 정면, 측면, 3/4뷰, 3가지 표정
- 개별 생성 / 배치 생성 (병렬)
- 히스토리: 최근 10개 이미지 보관
- 업로드: 파일 (JPG/PNG/GIF, 최대 5MB) 또는 URL

### 2.3 페이지 관리 & 삽화 생성 ✅

- 본문 텍스트 인라인 편집
- 장면 설명 편집: 캐릭터/배경/분위기 구조화
- 드래그 & 드롭 순서 변경
- 페이지 추가/삭제/복제
- 캐릭터 레퍼런스 참조로 삽화 일관성 유지
- 개별/배치(병렬/순차) 생성
- 수정사항 입력 (페이지별)
- 히스토리 관리 (최근 10개)

### 2.4 표지 이미지 생성 ✅

- 캐릭터 참조 선택 (체크박스)
- 커스텀 프롬프트
- 비율 선택: 4:3, 3:4, 16:9, 9:16, 1:1
- 히스토리 관리 / 업로드

### 2.5 Key Objects (핵심 사물) ✅

- AI 자동 추출: 각 페이지의 핵심 사물
- 이미지 생성: 교육용 아이콘 스타일
- 관리: 이름, 한글명, 설명, 예문, 크기(S/M/L + cm)
- 배치 생성 / 일괄 업로드

### 2.6 TTS (Text-to-Speech) ✅

- 다중 엔진: Gemini TTS, Minimax TTS, ElevenLabs TTS
- 음성 캐릭터: 엄마, 할머니, 선생님, 친구, 내레이터 등
- 설정: 톤, 속도, 스타일
- 다국어 지원
- 배치 생성 / 업로드

### 2.7 배경음악 ✅

- 프리셋 라이브러리 (분위기별)
- 미리듣기 / 업로드

### 2.8 다국어 번역 ✅

- 지원 언어: 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어
- Gemini 번역 API
- 배치 번역
- 번역 텍스트 TTS 생성

### 2.9 퀴즈 생성 ✅

- Key Objects 기반 자동 생성
- 유형: 순서 맞추기, 낱말 찾기, 어휘 학습
- 난이도: 쉬움/보통/어려움

### 2.10 오디오북/영상 생성 ✅

- YouTube용 동영상 생성
- Instagram 릴스 생성
- 자막 포함
- BGM + TTS 합성

### 2.11 동화책 뷰어 (프리뷰) ✅

- 저작도구 내 읽기 모드 프리뷰
- TTS 재생 + 배경음악
- 페이지 스와이프

---

## 3. Data Model

### 3.1 Storybook
```typescript
interface Storybook {
  id: string;
  title: string;
  targetAge: '3-4' | '4-5' | '5-7' | '7-8';
  artStyle: string;
  language: string;
  referenceContent?: string;
  category?: string;
  folder?: string;
  isPublic: boolean;

  // 표지
  coverPrompt: string;
  coverImage?: string;
  coverImageHistory: string[];
  coverAspectRatio: string;

  // 이미지 모델 설정
  imageModels: Record<string, string>;

  // 콘텐츠
  characters: Character[];
  pages: Page[];
  key_objects: KeyObject[];
  keyObjectImages: KeyObjectImage[];

  // 교육 콘텐츠
  educational_content: EducationalContent;

  // 배경음악
  backgroundMusicUrl?: string;

  // 오디오북
  audiobookProjects?: AudiobookProject[];

  // 메타
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Character
```typescript
interface Character {
  name: string;
  description: string;          // 영어 설명
  age?: number;
  role?: string;
  height?: number;              // 50-250px
  referenceImage?: string;      // R2 URL
  imageHistory: string[];
  customPrompt?: string;
}
```

### 3.3 Page
```typescript
interface Page {
  text: string;                 // 본문 (기본 언어)
  scene_description: string;    // 영어 장면 설명
  illustrationUrl?: string;     // R2 URL
  illustrationHistory?: string[];
  ttsUrl?: string;
  customModifications?: string;

  // 번역
  translations?: Record<string, PageTranslation>;
}

interface PageTranslation {
  text: string;
  ttsUrl?: string;
}
```

### 3.4 Key Object
```typescript
interface KeyObject {
  name: string;                 // 영어명
  description: string;
  pages: number[];              // 등장 페이지
}

interface KeyObjectImage {
  objectName: string;
  imageUrl: string;
}
```

### 3.5 Educational Content
```typescript
interface EducationalContent {
  vocabulary: VocabularyItem[];
  quiz: QuizItem[];
  learning_objectives: string[];
  moral_lesson: string;
}
```

---

## 4. API Endpoints (구현 완료)

### Storybook
```
GET    /api/storybooks                  # 목록
GET    /api/storybooks/:id              # 상세
POST   /api/storybooks                  # 저장
DELETE /api/storybooks/:id              # 삭제
POST   /api/storybooks/generate         # AI 전체 생성
POST   /api/storybooks/generate-story   # AI 스토리만 생성
```

### Image
```
POST   /api/images/character            # 캐릭터 이미지
POST   /api/images/illustration         # 페이지 삽화
POST   /api/images/cover                # 표지
POST   /api/images/key-object           # Key Object
POST   /api/images/vocabulary           # 어휘 이미지
POST   /api/images/upload               # 파일 업로드
POST   /api/images/analyze-style        # 그림체 분석
```

### TTS / Translation / Quiz / Audiobook
```
POST   /api/tts/generate                # 단일 TTS
POST   /api/tts/batch                   # 배치 TTS
POST   /api/translations/page           # 단일 번역
POST   /api/translations/all            # 배치 번역
POST   /api/quiz/generate               # 퀴즈 생성
POST   /api/audiobooks/generate         # 영상 생성
GET    /api/audiobooks/progress/:id     # 진행률
```

---

## 5. Frontend 구조

```
features/
├── storybook/       # 동화책 CRUD + 사이드바
├── editor/          # 에디터 레이아웃 + 탭 관리
├── character/       # 캐릭터 레퍼런스
├── cover/           # 표지 이미지
├── illustration/    # 페이지 삽화
├── key-object/      # 핵심 사물
├── tts/             # TTS 음성
├── translation/     # 다국어 번역
├── quiz/            # 퀴즈
├── audiobook/       # 오디오북/영상
├── settings/        # 동화책 설정
└── viewer/          # 뷰어 프리뷰
```

---

## 6. 미구현 기능 (TODO)

- [ ] 동화책 공개/비공개 설정
- [ ] 다운로드 (전체 텍스트/이미지/오디오)
- [ ] 동화책 ↔ 파닉스 콘텐츠 자동 연계 (→ PRD_02에서 다룸)

---

*Document End*
*Last Updated: 2026-02-23*
