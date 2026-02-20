# TangoBook Platform - Product Requirements Document (PRD) v2.0

## Document Info
- **Version**: 2.0
- **Date**: 2026-02-18
- **Status**: Draft
- **Tech Stack**: React + TypeScript + Vite (Frontend) / Express + TypeScript (Backend)

---

## 1. Product Overview

### 1.1 Vision
> "이야기와 춤추는 우리 아이" - 아이는 수동적인 독자가 아닌, 능동적인 이야기의 주인공으로 성장합니다.

### 1.2 Mission
동화책(재미) + 언어학습(교육) + AI 맞춤형 큐레이션을 결합한 **유아동 자기주도 학습 플랫폼**

### 1.3 Product Suite
TangoBook은 3개의 핵심 제품으로 구성됩니다:

| # | 제품 | 설명 | 대상 사용자 |
|---|------|------|------------|
| 1 | **동화책 & 파닉스 뷰어 앱** | 아이가 직접 사용하는 학습 플랫폼 | 4~8세 아이 |
| 2 | **저작도구 (Author Tool)** | AI 기반 동화책 제작 도구 | 크리에이터, 교사, 학부모 |
| 3 | **학부모 리포팅** | 학습 진도 및 성과 대시보드 | 학부모 |

### 1.4 Core Value Proposition
- **동화책 + 파닉스 연계**: 동화책 속 어휘가 자동으로 파닉스 학습 재료가 됨
- **AI 맞춤 큐레이션**: 아이의 취향/수준/약점을 분석하여 콘텐츠 추천
- **무한 콘텐츠**: AI로 3분 만에 동화책 1권 제작, 크리에이터 마켓으로 확장
- **초등 입학 전 완성**: 한글/영어 파닉스 + 필수 어휘 300단어

---

## 2. User Roles & Authentication

### 2.1 User Roles

| Role | 설명 | 권한 |
|------|------|------|
| `viewer` | 동화책 뷰어 사용자 (아이/학부모) | 공개 동화책 열람, 파닉스 학습, 게임 |
| `creator` | 저작도구 사용자 | 동화책 생성/편집/삭제, 본인 콘텐츠 관리 |
| `admin` | 플랫폼 관리자 | 전체 콘텐츠 관리, 사용자 관리, 통계 |

### 2.2 Authentication System

#### 2.2.1 회원가입/로그인
- **이메일 + 비밀번호** 기본 인증
- **소셜 로그인**: Google, Kakao, Naver (OAuth 2.0)
- **JWT 기반** 토큰 인증 (Access Token + Refresh Token)
- Access Token: 1시간 만료
- Refresh Token: 7일 만료, httpOnly 쿠키

#### 2.2.2 사용자 데이터 격리
- 각 사용자는 본인이 만든 동화책만 조회/편집/삭제 가능
- R2 저장 경로: `users/{userId}/storybooks/{storybookId}/`
- 공개 설정한 동화책만 뷰어에 노출

#### 2.2.3 User Data Model
```typescript
interface User {
  id: string;                    // UUID
  email: string;
  name: string;
  profileImage?: string;
  role: 'viewer' | 'creator' | 'admin';
  provider: 'email' | 'google' | 'kakao' | 'naver';
  createdAt: string;             // ISO timestamp
  lastLoginAt: string;
  settings: UserSettings;
}

interface UserSettings {
  defaultArtStyle: string;
  defaultTargetAge: string;
  defaultLanguage: string;
  ttsPreference: string;
}
```

---

## 3. Product 1: 저작도구 (Author Tool)

### 3.1 Overview
AI를 활용하여 비전문가도 고품질 동화책을 제작할 수 있는 웹 기반 저작도구

### 3.2 Features

#### 3.2.1 동화책 생성 (Story Generation)

**입력**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | Y | 동화책 제목 |
| targetAge | enum | Y | '3-4' / '4-5' / '5-7' / '7-8' |
| artStyle | string | Y | 7가지 프리셋 + 커스텀 입력 |
| language | string | Y | 기본 언어 (한국어, 영어 등) |
| referenceContent | string | N | 참고할 스토리 내용 |
| pageCount | number | N | 페이지 수 (기본 10-12) |

**AI 자동 생성 결과**
- 10-12페이지 스토리 (연령별 맞춤 어휘/문장 난이도)
- 3-8명 캐릭터 (이름, 설명, 역할, 나이)
- 페이지별 구조화된 장면 설명
- 8개 이상 핵심 어휘 (영어+한글)
- Key Objects (핵심 사물)
- 5-10개 퀴즈

**그림체 프리셋**
- 현대 일러스트 / 수채화 / 카툰 / 전통 동화책
- 애니메이션 / 유화 / 연필 스케치
- 커스텀 입력 (예: "Pixar style 3D", "지브리 스타일")

#### 3.2.2 캐릭터 레퍼런스 시스템

**캐릭터 관리**
- CRUD: 캐릭터 추가, 수정, 삭제
- 필드: 이름, 설명(영어), 나이, 역할, 키(50-250px)
- 프롬프트 커스터마이징

**레퍼런스 이미지 생성**
- 멀티뷰 레이아웃: 정면, 측면, 3/4뷰, 3가지 표정
- 개별 생성 / 배치 생성 (병렬)
- 히스토리: 최근 10개 이미지 보관, 썸네일로 이전 이미지 복원
- 업로드: 파일 (JPG/PNG/GIF, 최대 5MB) 또는 URL

#### 3.2.3 페이지 관리 & 삽화 생성

**페이지 편집**
- 본문 텍스트 인라인 편집 (다국어)
- 장면 설명 편집: 캐릭터/배경/분위기 구조화
- 드래그 & 드롭 순서 변경
- 페이지 추가/삭제/복제

**삽화 생성**
- 캐릭터 레퍼런스 참조로 일관성 유지
- Key Object 참조
- 개별/배치(병렬/순차) 생성
- 수정사항 입력 (페이지별)
- 히스토리 관리 (최근 10개)
- 업로드 (파일/URL)
- 일괄 업로드

#### 3.2.4 표지 이미지 생성
- 캐릭터 참조 선택 (체크박스)
- 커스텀 프롬프트
- 비율 선택: 4:3, 3:4, 16:9, 9:16, 1:1
- 히스토리 관리
- 업로드

#### 3.2.5 Key Objects (핵심 사물)
- AI 자동 추출: 각 페이지의 핵심 사물
- 이미지 생성: 교육용 아이콘 스타일
- 관리: 이름, 한글명, 설명, 예문, 크기(S/M/L + cm)
- 배치 생성 / 일괄 업로드
- **파닉스 학습과 자동 연계** (NEW)

#### 3.2.6 TTS (Text-to-Speech)
- **다중 엔진**: Gemini TTS, Minimax TTS, ElevenLabs TTS
- 음성 캐릭터: 엄마, 할머니, 선생님, 친구, 내레이터 등
- 설정: 톤, 속도, 스타일
- 다국어 지원
- 배치 생성 / 업로드 / 일괄 업로드

#### 3.2.7 배경음악
- 프리셋 라이브러리 (분위기별)
- 미리듣기
- 업로드

#### 3.2.8 다국어 번역
- 지원 언어: 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어
- Gemini 번역 API
- 배치 번역
- 번역 텍스트 TTS 생성

#### 3.2.9 퀴즈 생성
- Key Objects 기반 자동 생성
- 유형: 순서 맞추기, 낱말 찾기, 어휘 학습
- 난이도: 쉬움/보통/어려움

#### 3.2.10 동화책 공개/비공개 설정 (NEW)
- 공개 설정: 뷰어 앱에서 열람 가능
- 비공개 (기본값): 본인만 접근 가능
- 공개 시 메타데이터 자동 생성 (제목, 썸네일, 요약, 연령, 페이지 수)

#### 3.2.11 다운로드
- 전체 텍스트 (.txt)
- 전체 오디오 (일괄)
- 전체 삽화 (일괄)
- 캐릭터 레퍼런스 (일괄)
- Key Object 이미지 (일괄)
- 개별 다운로드

#### 3.2.12 영상 생성 (고급)
- YouTube용 동영상 생성
- Instagram 릴스 생성
- 자막 포함

---

## 4. Product 2: 동화책 & 파닉스 뷰어 앱

### 4.1 Overview
아이들이 직접 사용하는 동화책 열람 및 파닉스 학습 플랫폼

### 4.2 동화책 뷰어

#### 4.2.1 홈/탐색
- 동화책 목록 (카드형 그리드)
- 카테고리 필터: 장르, 연령, 그림체, 언어
- AI 맞춤 추천 (큐레이션)
- 검색
- 인기/최신/추천 정렬
- 북마크/즐겨찾기

#### 4.2.2 동화책 리더
- 페이지 넘기기 (터치/스와이프)
- TTS 오디오 자동 재생
- 배경음악 동시 재생
- **실시간 언어 전환** (한국어 ↔ 영어 ↔ 일본어 ↔ 중국어)
- 텍스트 크기 조절
- 밝기/다크모드
- 읽기 진도 자동 저장
- 터치 친화적 UI (큰 버튼)

#### 4.2.3 AI 기반 기능
- 난이도 자동 조절: 아이 수준 실시간 분석
- 선호도 학습: 그림체, 관심사, 언어 수준
- 맞춤 추천: 취향+수준 기반 동화 5권 추천
- 어휘 자동 하이라이트 (학습 대상 단어)

### 4.3 파닉스 학습 시스템 (NEW)

#### 4.3.1 동화책-파닉스 연계 흐름
```
동화책 속 어휘 추출
  → 파닉스 분해 (자모음 단위)
  → 아이의 약점 분석
  → 맞춤 학습 게임 자동 생성
```

예시: 동화책 "빨간 망토"에서 어휘 "망토" 추출
→ 파닉스 분해: ㅁ+ㅏ+ㅇ, ㅌ+ㅗ
→ 약점 분석: 받침 'ㅇ' 약함
→ 받침 'ㅇ' 강화 게임 자동 생성

#### 4.3.2 한글 파닉스 커리큘럼
| 단계 | 연령 | 학습 내용 | 목표 |
|------|------|-----------|------|
| Step 1 | 3-4세 | 자음 ㄱㄴㄷ 기본 소리 익히기 | 자음 인식 |
| Step 2 | 5-6세 | 모음 결합 (가, 나, 다), 받침 없는 글자 | 기본 글자 읽기 |
| Step 3 | 6-7세 | 받침 (ㄱ,ㄴ,ㄹ,ㅁ...), 겹받침, 이중모음 | 한글 완성 |

**최종 목표**: 파닉스 마스터 + 한글 300 어휘

#### 4.3.3 영어 파닉스 커리큘럼
| 단계 | 연령 | 학습 내용 | 목표 |
|------|------|-----------|------|
| Step 1 | 3-4세 | 알파벳 A-Z 소리 익히기 | 알파벳 인식 |
| Step 2 | 5-6세 | CVC 단어 (cat, dog, sun) | 기본 단어 읽기 |
| Step 3 | 6-7세 | 장모음, 이중자음 (ch, sh, th) | 영어 읽기 |

**최종 목표**: 파닉스 마스터 + 영어 300 어휘

#### 4.3.4 파닉스 학습 게임 유형
| 게임 | 설명 |
|------|------|
| 자모음 조합 | 자음+모음을 드래그하여 글자 만들기 |
| 소리 듣고 찾기 | TTS 소리를 듣고 해당 글자/단어 찾기 |
| 빈칸 채우기 | 단어에서 빠진 자모음 채우기 |
| 단어 만들기 | 자모음 카드로 단어 완성하기 |
| 매칭 게임 | 그림과 단어 매칭 (메모리 게임) |
| 순서 맞추기 | 이야기 순서대로 그림 배열 |
| 따라 쓰기 | 캔버스에 글자 따라 쓰기 |

### 4.4 기존 학습 게임 (유지)
| 게임 | 설명 |
|------|------|
| Memory Match | 카드 뒤집기 매칭 게임 |
| Story Quiz | 4지선다 스토리 퀴즈 |
| Story Sequence | 이야기 순서 맞추기 |
| Word Writing | 단어 쓰기 연습 |

---

## 5. Product 3: 학부모 리포팅

### 5.1 Overview
데이터 기반으로 아이의 학습 성과를 추적하고 시각화하는 대시보드

### 5.2 Features

#### 5.2.1 주간 학습 리포트
- 자동 생성 (매주 월요일)
- 5가지 영역 레이더 차트: 읽기, 듣기, 말하기, 쓰기, 이해력
- 어휘 습득 추적: 새로 배운 단어 자동 기록
- 파닉스 완성도: 실시간 진도 시각화
- 학습 스트릭: 연속 학습일 기록

#### 5.2.2 AI 맞춤 추천
- 약점 기반 다음 학습 활동 자동 제안
- 콘텐츠 추천 (파닉스 약점 보강)
- "독서 30분"이 아닌 "어휘 12개 습득, 파닉스 87% 완성"으로 성과 증명

#### 5.2.3 선호도 분석
- 그림체 선호도 (픽사, 지브리, 웹툰 등)
- TTS 목소리 선호도
- 관심사 분석 (공룡, 공주, 우주 등)
- AI 추천 메시지 (예: "지브리 스타일 + 엄마 목소리로 우선 제공할게요!")

---

## 6. Data Models

### 6.1 User
```typescript
interface User {
  id: string;                       // UUID v4
  email: string;
  passwordHash?: string;            // email 인증 시
  name: string;
  profileImage?: string;            // R2 URL
  role: 'viewer' | 'creator' | 'admin';
  provider: 'email' | 'google' | 'kakao' | 'naver';

  // 구독
  subscription: {
    plan: 'free' | 'premium';
    expiresAt?: string;
  };

  // 자녀 프로필 (뷰어 사용자용)
  children?: ChildProfile[];

  // 설정
  settings: UserSettings;

  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  preferredArtStyles: string[];
  preferredTopics: string[];
  languageLevel: {
    korean: 'beginner' | 'intermediate' | 'advanced';
    english: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface UserSettings {
  defaultArtStyle: string;
  defaultTargetAge: string;
  defaultLanguage: string;
  ttsVoice: string;
  theme: 'light' | 'dark';
}
```

### 6.2 Storybook
```typescript
interface Storybook {
  // 식별
  id: string;                       // UUID or timestamp
  userId: string;                   // 소유자 (NEW)

  // 기본 정보
  title: string;
  targetAge: '3-4' | '4-5' | '5-7' | '7-8';
  artStyle: string;
  language: string;                 // 기본 언어
  referenceContent?: string;

  // 공개 설정 (NEW)
  isPublic: boolean;
  publishedAt?: string;

  // 폴더 관리
  folderId?: string;

  // 표지
  coverPrompt: string;
  coverImage?: string;              // R2 URL
  coverImageHistory: string[];      // 최근 10개
  coverAspectRatio: string;
  coverCharacterRefs: number[];

  // 콘텐츠
  characters: Character[];
  pages: Page[];
  keyObjects: KeyObject[];

  // 교육 콘텐츠
  educationalContent: EducationalContent;

  // 배경음악
  backgroundMusic?: string;         // R2 URL

  // 번역
  translations: Record<string, Translation>;

  // 메타
  createdAt: string;
  updatedAt: string;

  // 통계
  viewCount: number;
  likeCount: number;
}
```

### 6.3 Character
```typescript
interface Character {
  id: string;
  name: string;
  description: string;              // 영어 설명
  koreanName?: string;
  age?: number;
  role: '주인공' | '조력자' | '악역' | '조연';
  height: number;                   // 50-250 pixels

  // 레퍼런스 이미지
  referenceImage?: string;          // R2 URL
  imageHistory: string[];           // 최근 10개
  customPrompt?: string;
}
```

### 6.4 Page
```typescript
interface Page {
  id: string;
  pageNumber: number;

  // 텍스트
  text: string;                     // 본문 (기본 언어)

  // 장면 설명
  sceneDescription: string;         // 영어
  sceneStructure: {
    characters: string;
    background: string;
    atmosphere: string;
    spatialLayout?: string;
    timeOfDay?: string;
  };

  // 삽화
  illustrationUrl?: string;         // R2 URL
  illustrationHistory: string[];
  customModifications?: string;

  // TTS
  ttsUrl?: string;                  // R2 URL
  ttsEngine?: string;
  ttsVoice?: string;

  // 핵심 사물
  keyObjectRefs: string[];          // Key Object IDs

  // 파닉스 연계 (NEW)
  extractedVocabulary?: ExtractedWord[];
}
```

### 6.5 Key Object
```typescript
interface KeyObject {
  id: string;
  name: string;                     // 영어명
  koreanName: string;
  description: string;
  example: string;
  size: 'small' | 'medium' | 'large';
  sizeCm?: number;
  pages: number[];                  // 등장 페이지
  imageUrl?: string;                // R2 URL
  imageHistory: string[];
}
```

### 6.6 Educational Content
```typescript
interface EducationalContent {
  vocabulary: VocabularyItem[];
  quiz: QuizItem[];
  learningObjectives: string[];
  moralLesson: string;
}

interface VocabularyItem {
  word: string;                     // 영어
  korean: string;
  definition: string;
  example: string;
  imageUrl?: string;
  isKeyObject: boolean;

  // 파닉스 연계 (NEW)
  phonics?: {
    korean: string[];               // ['ㅁ', 'ㅏ', 'ㅇ', 'ㅌ', 'ㅗ']
    english: string[];              // ['c', 'a', 't']
  };
}

interface QuizItem {
  question: string;
  options: string[];                // 4개
  correctAnswer: number;            // 0-3
  type: 'multiple-choice' | 'sequence' | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
}
```

### 6.7 Phonics Data (NEW)
```typescript
interface PhonicsProgress {
  userId: string;
  childId: string;

  korean: {
    level: 1 | 2 | 3;
    consonants: Record<string, PhonicsUnit>;   // ㄱ,ㄴ,ㄷ...
    vowels: Record<string, PhonicsUnit>;       // ㅏ,ㅓ,ㅗ...
    batchim: Record<string, PhonicsUnit>;      // 받침
    masteredWords: string[];
    totalWords: number;
  };

  english: {
    level: 1 | 2 | 3;
    letters: Record<string, PhonicsUnit>;      // A-Z
    blends: Record<string, PhonicsUnit>;       // ch, sh, th...
    masteredWords: string[];
    totalWords: number;
  };

  weaknesses: string[];              // 약한 자모음 패턴
  updatedAt: string;
}

interface PhonicsUnit {
  recognized: boolean;               // 인식 가능 여부
  accuracy: number;                   // 0-100%
  practiceCount: number;
  lastPracticedAt: string;
}

interface LearningSession {
  id: string;
  userId: string;
  childId: string;
  storybookId?: string;
  type: 'reading' | 'phonics' | 'game' | 'quiz';

  // 세션 데이터
  startedAt: string;
  endedAt: string;
  duration: number;                   // seconds

  // 성과
  wordsEncountered: string[];
  wordsLearned: string[];
  phonicsPracticed: string[];
  quizScore?: number;
  gameScore?: number;

  // 행동
  pagesRead: number;
  languageSwitches: number;
  bookmarked: boolean;
  completed: boolean;
}
```

---

## 7. System Architecture

### 7.1 High-Level Architecture
```
┌─────────────────────────────────────────────────┐
│                   Frontend (React + TypeScript)  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Author   │  │ Viewer   │  │ Parent Report │  │
│  │ Tool     │  │ App      │  │ Dashboard     │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │           │
│       └──────────────┼───────────────┘           │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │ REST API
┌──────────────────────┼───────────────────────────┐
│            Backend (Express + TypeScript)         │
│                      │                           │
│  ┌─────────┐  ┌──────┴──────┐  ┌─────────────┐  │
│  │ Auth    │  │ API Routes  │  │ Middleware   │  │
│  │ Module  │  │             │  │ (JWT, CORS)  │  │
│  └────┬────┘  └──────┬──────┘  └─────────────┘  │
│       │              │                           │
│  ┌────┴──────────────┴──────────────────────┐    │
│  │           Service Layer                   │    │
│  │  Story | Image | TTS | Quiz | Phonics    │    │
│  └────┬──────────────┬──────────────────────┘    │
│       │              │                           │
│  ┌────┴────┐   ┌─────┴─────┐                    │
│  │ Gemini  │   │ R2 Storage│                    │
│  │ AI API  │   │           │                    │
│  └─────────┘   └───────────┘                    │
└──────────────────────────────────────────────────┘
```

### 7.2 Frontend Architecture (React + TypeScript + Vite)
```
src/
├── app/
│   ├── App.tsx                     # Root component + Router
│   ├── providers/                  # Context providers
│   │   ├── AuthProvider.tsx
│   │   ├── StorybookProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── router/
│       └── index.tsx               # Route definitions
│
├── features/                       # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── SocialLoginButtons.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   └── types.ts
│   │
│   ├── author/                     # 저작도구
│   │   ├── components/
│   │   │   ├── StoryEditor/
│   │   │   │   ├── StoryForm.tsx
│   │   │   │   ├── PageEditor.tsx
│   │   │   │   └── PageList.tsx
│   │   │   ├── CharacterPanel/
│   │   │   │   ├── CharacterList.tsx
│   │   │   │   ├── CharacterCard.tsx
│   │   │   │   └── ReferenceGenerator.tsx
│   │   │   ├── CoverPanel/
│   │   │   ├── KeyObjectPanel/
│   │   │   ├── TTSPanel/
│   │   │   ├── TranslationPanel/
│   │   │   ├── QuizPanel/
│   │   │   ├── MusicPanel/
│   │   │   ├── DownloadPanel/
│   │   │   └── SettingsPanel/
│   │   ├── hooks/
│   │   │   ├── useStorybook.ts
│   │   │   ├── useCharacters.ts
│   │   │   ├── usePages.ts
│   │   │   ├── useImageGeneration.ts
│   │   │   └── useTTS.ts
│   │   ├── services/
│   │   │   ├── storyService.ts
│   │   │   ├── imageService.ts
│   │   │   ├── ttsService.ts
│   │   │   └── translationService.ts
│   │   └── types.ts
│   │
│   ├── viewer/                     # 동화책 뷰어
│   │   ├── components/
│   │   │   ├── BookShelf/
│   │   │   ├── BookReader/
│   │   │   ├── RecommendationBar/
│   │   │   └── LanguageSwitcher/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── phonics/                    # 파닉스 학습 (NEW)
│   │   ├── components/
│   │   │   ├── PhonicsHome/
│   │   │   ├── KoreanPhonics/
│   │   │   ├── EnglishPhonics/
│   │   │   ├── PhonicsGame/
│   │   │   └── ProgressTracker/
│   │   ├── hooks/
│   │   │   ├── usePhonics.ts
│   │   │   └── usePhonicsGame.ts
│   │   ├── services/
│   │   │   └── phonicsService.ts
│   │   ├── engine/                 # 게임 엔진
│   │   │   ├── GameBase.ts
│   │   │   ├── CanvasUtil.ts
│   │   │   └── SoundManager.ts
│   │   └── types.ts
│   │
│   ├── games/                      # 학습 게임
│   │   ├── components/
│   │   │   ├── MemoryMatch/
│   │   │   ├── StoryQuiz/
│   │   │   ├── StorySequence/
│   │   │   └── WordWriting/
│   │   └── engine/
│   │
│   └── report/                     # 학부모 리포팅
│       ├── components/
│       │   ├── Dashboard/
│       │   ├── WeeklyReport/
│       │   ├── PhonicsProgress/
│       │   └── VocabularyTracker/
│       ├── hooks/
│       └── services/
│
├── shared/                         # 공유 모듈
│   ├── components/
│   │   ├── ui/                     # 공통 UI (Button, Modal, Card...)
│   │   ├── layout/                 # Layout components
│   │   └── feedback/               # Toast, Loading, Error...
│   ├── hooks/
│   │   ├── useApi.ts
│   │   └── useUpload.ts
│   ├── services/
│   │   └── apiClient.ts            # Axios instance + interceptors
│   ├── types/                      # 공유 타입
│   │   ├── storybook.ts
│   │   ├── user.ts
│   │   └── api.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
│
├── assets/
│   ├── images/
│   └── sounds/
│
└── styles/
    └── globals.css                 # Tailwind imports
```

### 7.3 Backend Architecture (Express + TypeScript)
```
server/
├── src/
│   ├── app.ts                      # Express app setup
│   ├── server.ts                   # Server entry point
│   │
│   ├── config/
│   │   ├── env.ts                  # Environment variables
│   │   ├── cors.ts
│   │   └── constants.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication
│   │   ├── errorHandler.ts         # Global error handling
│   │   ├── rateLimiter.ts          # API rate limiting
│   │   ├── validator.ts            # Request validation
│   │   └── upload.ts               # Multer file upload
│   │
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   ├── storybook.routes.ts     # /api/storybooks/*
│   │   ├── image.routes.ts         # /api/images/*
│   │   ├── tts.routes.ts           # /api/tts/*
│   │   ├── translation.routes.ts   # /api/translations/*
│   │   ├── quiz.routes.ts          # /api/quiz/*
│   │   ├── phonics.routes.ts       # /api/phonics/* (NEW)
│   │   ├── viewer.routes.ts        # /api/viewer/*
│   │   └── upload.routes.ts        # /api/upload/*
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── storybook.controller.ts
│   │   ├── image.controller.ts
│   │   ├── tts.controller.ts
│   │   ├── translation.controller.ts
│   │   ├── quiz.controller.ts
│   │   ├── phonics.controller.ts   # NEW
│   │   ├── viewer.controller.ts
│   │   └── upload.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts         # JWT, password hashing
│   │   ├── user.service.ts         # User CRUD
│   │   ├── storybook.service.ts    # Storybook CRUD
│   │   ├── gemini.service.ts       # Gemini AI API
│   │   ├── image.service.ts        # Image generation
│   │   ├── tts.service.ts          # TTS generation
│   │   ├── translation.service.ts
│   │   ├── quiz.service.ts
│   │   ├── phonics.service.ts      # NEW
│   │   └── r2.service.ts           # Cloudflare R2
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── storybook.model.ts
│   │   ├── phonics.model.ts        # NEW
│   │   └── session.model.ts        # NEW
│   │
│   ├── types/
│   │   ├── express.d.ts            # Express type extensions
│   │   ├── api.types.ts
│   │   └── gemini.types.ts
│   │
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts               # Custom error classes
│       └── helpers.ts
│
├── prompts/                        # AI System Prompts
│   ├── story-generation.txt
│   ├── image-generation.txt
│   ├── phonics-extraction.txt      # NEW
│   └── quiz-generation.txt
│
├── tsconfig.json
└── package.json
```

---

## 8. API Specification

### 8.1 Authentication APIs

```
POST   /api/auth/register          # 회원가입
POST   /api/auth/login             # 로그인
POST   /api/auth/logout            # 로그아웃
POST   /api/auth/refresh           # 토큰 갱신
POST   /api/auth/social/:provider  # 소셜 로그인 (google/kakao/naver)
GET    /api/auth/me                # 현재 사용자 정보
PUT    /api/auth/me                # 사용자 정보 수정
PUT    /api/auth/password          # 비밀번호 변경
```

### 8.2 Storybook APIs (인증 필요)

```
# CRUD (본인 동화책만)
GET    /api/storybooks             # 내 동화책 목록
GET    /api/storybooks/:id         # 동화책 상세
POST   /api/storybooks             # 동화책 저장
PUT    /api/storybooks/:id         # 동화책 수정
DELETE /api/storybooks/:id         # 동화책 삭제
PUT    /api/storybooks/:id/publish # 공개/비공개 설정

# AI 생성
POST   /api/storybooks/generate    # AI 스토리 생성
```

### 8.3 Image APIs (인증 필요)

```
POST   /api/images/character       # 캐릭터 레퍼런스 생성
POST   /api/images/illustration    # 페이지 삽화 생성
POST   /api/images/cover           # 표지 이미지 생성
POST   /api/images/key-object      # Key Object 이미지 생성
POST   /api/images/vocabulary      # 학습 단어 이미지 생성
DELETE /api/images/cleanup         # 히스토리 이미지 삭제
```

### 8.4 TTS APIs (인증 필요)

```
POST   /api/tts/generate           # 단일 TTS 생성
POST   /api/tts/generate-all       # 전체 TTS 배치 생성
```

### 8.5 Translation APIs (인증 필요)

```
POST   /api/translations/page      # 단일 페이지 번역
POST   /api/translations/all       # 전체 페이지 배치 번역
```

### 8.6 Quiz APIs (인증 필요)

```
POST   /api/quiz/generate          # 퀴즈 생성
```

### 8.7 Upload APIs (인증 필요)

```
POST   /api/upload/image           # 이미지 업로드
POST   /api/upload/audio           # 오디오 업로드
POST   /api/upload/music           # 배경음악 업로드
```

### 8.8 Viewer APIs (공개/인증 선택)

```
GET    /api/viewer/storybooks      # 공개 동화책 목록
GET    /api/viewer/storybooks/:id  # 공개 동화책 상세
GET    /api/viewer/recommended     # AI 추천 동화책
POST   /api/viewer/reading-session # 읽기 세션 기록
```

### 8.9 Phonics APIs (NEW, 인증 필요)

```
GET    /api/phonics/progress/:childId         # 파닉스 진도 조회
PUT    /api/phonics/progress/:childId         # 파닉스 진도 업데이트
POST   /api/phonics/extract/:storybookId      # 동화책에서 어휘 추출
POST   /api/phonics/generate-game             # 맞춤 학습 게임 생성
GET    /api/phonics/weaknesses/:childId       # 약점 분석
```

### 8.10 Report APIs (인증 필요)

```
GET    /api/reports/weekly/:childId           # 주간 리포트
GET    /api/reports/vocabulary/:childId       # 어휘 습득 현황
GET    /api/reports/phonics/:childId          # 파닉스 진도
GET    /api/reports/preferences/:childId      # 선호도 분석
```

---

## 9. Tech Stack

### 9.1 Frontend
| 기술 | 용도 | 버전 |
|------|------|------|
| React | UI 프레임워크 | 19.x |
| TypeScript | 타입 안전성 | 5.x |
| Vite | 빌드 도구 | 6.x |
| React Router | 라우팅 | 7.x |
| Zustand | 상태 관리 | 5.x |
| TanStack Query | 서버 상태 관리 | 5.x |
| Tailwind CSS | 스타일링 | 4.x |
| Axios | HTTP 클라이언트 | 1.x |
| React Hook Form | 폼 관리 | 7.x |
| Zod | 스키마 검증 | 3.x |

### 9.2 Backend
| 기술 | 용도 | 버전 |
|------|------|------|
| Node.js | 런타임 | 20.x LTS |
| Express | 웹 프레임워크 | 5.x |
| TypeScript | 타입 안전성 | 5.x |
| jsonwebtoken | JWT 인증 | 9.x |
| bcrypt | 비밀번호 해싱 | 5.x |
| @google/generative-ai | Gemini API | latest |
| @aws-sdk/client-s3 | R2 스토리지 | 3.x |
| multer | 파일 업로드 | 2.x |
| cors | CORS | 2.x |
| dotenv | 환경 변수 | 16.x |
| zod | 요청 검증 | 3.x |
| helmet | 보안 헤더 | 8.x |

### 9.3 AI Models
| 모델 | 용도 |
|------|------|
| Gemini 2.5 Flash | 스토리 생성, 번역, 퀴즈, 어휘 추출 |
| Gemini 3 Pro Image | 이미지 생성 (캐릭터, 삽화, 표지, Key Object) |
| Gemini 2.5 Flash TTS | 음성 합성 |
| Minimax TTS | 고품질 다국어 TTS |
| ElevenLabs TTS | 프리미엄 TTS |

### 9.4 Infrastructure
| 기술 | 용도 |
|------|------|
| Cloudflare R2 | 이미지/오디오/JSON 스토리지 |
| Railway | 프로덕션 배포 (Docker) |
| ESLint | 코드 린팅 |
| Prettier | 코드 포맷팅 |
| Husky + lint-staged | pre-commit 훅 |

### 9.5 Deployment
| 항목 | 설명 |
|------|------|
| 호스팅 | Railway (Docker 컨테이너) |
| 배포 방식 | GitHub push → 자동 빌드/배포 |
| 서비스 구성 | 단일 서비스 (Express가 API + 클라이언트 정적 파일 서빙) |
| 빌드 | Dockerfile: pnpm build (shared → server → client) |
| 런타임 | `node packages/server/dist/server/src/server.js` |
| 헬스체크 | `GET /health` (60초 타임아웃) |
| 프로덕션 URL | `https://tangobookserver-production.up.railway.app` |

**배포 아키텍처**
```
[GitHub Push] → [Railway 자동 빌드 (Dockerfile)]
                       │
                   pnpm build
                   (shared → server → client)
                       │
              [단일 Docker 컨테이너]
              ┌────────┴────────┐
              │  Express Server │
              │  ├─ /api/*      │  ← API 라우트
              │  ├─ /health     │  ← 헬스체크
              │  └─ /*          │  ← 클라이언트 정적 파일 (SPA)
              └─────────────────┘
```

**환경변수 (Railway)**
| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | Y | Google Gemini API 키 |
| `R2_ACCOUNT_ID` | Y | Cloudflare R2 계정 ID |
| `R2_ACCESS_KEY_ID` | Y | R2 액세스 키 |
| `R2_SECRET_ACCESS_KEY` | Y | R2 시크릿 키 |
| `R2_BUCKET_NAME` | Y | R2 버킷명 |
| `R2_PUBLIC_URL` | Y | R2 퍼블릭 URL |
| `NODE_ENV` | N | `production` (기본: development) |
| `MINIMAX_API_KEY` | N | Minimax TTS API 키 |
| `ELEVENLABS_API_KEY` | N | ElevenLabs TTS API 키 |

---

## 10. Storage Architecture

### 10.1 R2 Bucket Structure (NEW - 사용자 격리)
```
tangobook-bucket/
├── users/
│   └── {userId}/
│       ├── profile/
│       │   └── avatar.png
│       └── storybooks/
│           └── {storybookId}/
│               ├── data.json              # 동화책 JSON
│               ├── cover/
│               │   ├── current.png
│               │   └── history/
│               ├── characters/
│               │   └── {characterName}/
│               │       ├── current.png
│               │       └── history/
│               ├── illustrations/
│               │   └── page-{n}/
│               │       ├── current.png
│               │       └── history/
│               ├── key-objects/
│               │   └── {objectName}.png
│               ├── vocabulary/
│               │   └── {word}.png
│               └── audio/
│                   ├── tts/
│                   │   └── page-{n}.wav
│                   └── music/
│                       └── background.mp3
│
├── public/                                # 공개 동화책 (viewer용)
│   ├── metadata.json                      # 공개 동화책 인덱스
│   └── {storybookId}/
│       ├── data.json
│       ├── cover.png
│       ├── illustrations/
│       └── audio/
│
└── system/
    ├── music-library/                     # 배경음악 프리셋
    └── phonics-assets/                    # 파닉스 학습 에셋
```

### 10.2 Database Strategy
- **Phase 1**: R2 JSON 파일 기반 (현재와 호환)
  - 사용자 데이터: `users/{userId}/profile.json`
  - 동화책 데이터: `users/{userId}/storybooks/{id}/data.json`
  - 파닉스 진도: `users/{userId}/phonics/{childId}.json`

- **Phase 2 (향후)**: PostgreSQL or MongoDB 도입 검토
  - 사용자 인증 데이터
  - 학습 세션 로그
  - 통계/분석 데이터

---

## 11. Development Phases

### Phase 1: Foundation (2-3주)
- [ ] 프로젝트 scaffolding (Vite + React + TypeScript)
- [ ] 백엔드 구조 (Express + TypeScript + 레이어 분리)
- [ ] 인증 시스템 (회원가입, 로그인, JWT)
- [ ] R2 스토리지 연동 (사용자 격리)
- [ ] 기본 레이아웃 & 라우팅

### Phase 2: Author Tool Core (3-4주)
- [ ] 동화책 목록 (CRUD)
- [ ] AI 스토리 생성
- [ ] 캐릭터 관리 + 레퍼런스 이미지 생성
- [ ] 페이지 편집 + 삽화 생성
- [ ] 표지 생성
- [ ] Key Objects

### Phase 3: Author Tool Extended (2-3주)
- [ ] TTS 생성
- [ ] 번역
- [ ] 퀴즈 생성
- [ ] 배경음악
- [ ] 다운로드
- [ ] 동화책 공개/비공개

### Phase 4: Viewer App (3-4주)
- [ ] 동화책 리스트 (홈)
- [ ] 동화책 리더 (읽기)
- [ ] 언어 전환
- [ ] TTS 재생
- [ ] 학습 게임 (4종)
- [ ] AI 추천

### Phase 5: Phonics System (4-5주)
- [ ] 어휘 추출 엔진 (NLP)
- [ ] 한글 파닉스 (자모음 분해, 학습 게임)
- [ ] 영어 파닉스 (알파벳, CVC, 블렌드)
- [ ] 약점 분석 & 맞춤 게임 생성
- [ ] 파닉스 진도 추적

### Phase 6: Reporting & Polish (2-3주)
- [ ] 학부모 대시보드
- [ ] 주간 리포트
- [ ] 선호도 분석
- [ ] UI/UX 폴리시
- [ ] 성능 최적화

### Phase 7: Growth (ongoing)
- [ ] 소셜 로그인 (Kakao, Naver)
- [ ] 크리에이터 마켓플레이스
- [ ] 구독 모델
- [ ] 글로벌 확장 (다국어)
- [ ] B2B 기관 라이센스
- [ ] 모바일 앱 (React Native)

---

## 12. Business Model

### 12.1 B2C 구독
| 플랜 | 가격 | 제공 |
|------|------|------|
| Free | 무료 | 동화 5편/월, 화풍 1종, TTS 1종, 한국어만, 광고 |
| Premium | 월 9,900원 | 무제한, 화풍 30종, TTS 5종, 다국어, AI 조절, 주간 리포트, 광고 없음 |

### 12.2 크리에이터 수수료
- 크리에이터 70% / 플랫폼 30%

### 12.3 B2B 기관 라이센스
- 유치원, 어린이집, 도서관, 문화센터
- 연 300~500만원

### 12.4 출판 수익
- 인기 콘텐츠 선주문 기반 실물 출판
- 데이터 기반 선정 → 선주문 검증 → 리스크 제로

---

## 13. Migration Strategy

### 13.1 기존 데이터 호환
- R2에 저장된 60권 이상의 동화책 데이터 유지
- 기존 JSON 스키마 → 신규 스키마 마이그레이션 스크립트 제공
- 기존 이미지/오디오 URL 유지

### 13.2 마이그레이션 단계
1. 기존 동화책 JSON에 `userId` 필드 추가 (기본값: admin)
2. R2 경로 재구성: 기존 경로 → `users/{userId}/storybooks/`
3. 기존 URL redirect 처리

---

## 14. Non-Functional Requirements

### 14.1 Performance
- 페이지 로드: < 2초
- API 응답: < 500ms (AI 생성 제외)
- AI 이미지 생성: < 30초
- AI 스토리 생성: < 60초
- 동시 사용자: 100명 이상

### 14.2 Security
- HTTPS 필수
- JWT 토큰 기반 인증
- API Rate Limiting (100 req/min/user)
- XSS, CSRF 방어
- SQL Injection 방지
- 환경 변수로 시크릿 관리
- R2 버킷 접근 제어

### 14.3 Accessibility
- 터치 친화적 UI (유아 사용)
- 큰 버튼 (최소 44x44px)
- 높은 색대비
- 반응형 디자인 (태블릿 최적화)
- 음성 안내

---

*Document End*
*Last Updated: 2026-02-18*
*Next Review: Phase 1 완료 후*
