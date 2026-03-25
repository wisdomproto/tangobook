# Remotion 기반 오디오북 탭 리빌드

## 개요

기존 MoviePy 기반 오디오북 탭을 Remotion으로 교체한다.
정지 이미지에 Ken Burns 줌 + 타이프라이터 자막 + 파티클 효과를 적용하고,
클라이언트에서 Remotion Player로 실시간 프리뷰, 서버에서 `renderMedia()`로 최종 MP4를 생성한다.
롱폼 영상 탭은 그대로 유지한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 범위 | 오디오북 탭만 교체, 롱폼 유지 |
| 렌더링 | 서버 (`@remotion/renderer`) |
| 프리뷰 | 클라이언트 (`@remotion/player`) |
| Ken Burns | 자동 랜덤 (줌인/줌아웃/패닝) |
| 파티클 | 반짝이는 먼지/별 |
| 타이프라이터 | 자막에만 적용 |
| 장면 전환 | crossfade |
| YouTube | 포함 (기존 OAuth2 + 프리셋 재사용) |
| 지속시간 | TTS 길이 기반 자동 (없으면 3초) |
| 패키지 구조 | `packages/remotion/` 별도 패키지 |

## 아키텍처

### 패키지 구조

```
packages/
  remotion/                          # @tangobook/remotion (새 패키지)
    src/
      compositions/
        AudiobookComposition.tsx     # 메인 컴포지션 (Sequence 조합)
      components/
        KenBurnsSlide.tsx            # 정지이미지 + Ken Burns 줌/패닝
        TypewriterSubtitle.tsx       # 타이프라이터 자막
        SparkleParticles.tsx         # 반짝이는 먼지/별 파티클
        CoverSlide.tsx               # 표지 슬라이드
        EndingSlide.tsx              # 엔딩 슬라이드
      utils/
        ken-burns.ts                 # 랜덤 줌/패닝 파라미터 생성
      types.ts                       # AudiobookRenderProps 등
      index.ts                       # public exports
    package.json

  client/src/features/audiobook/
    components/
      AudiobookTab.tsx               # 교체: Remotion Player 기반
      AudiobookProjectCard.tsx       # 교체: 설정 + Player + 렌더/업로드 버튼
    api/audiobook.api.ts             # 수정: render + youtube 엔드포인트 추가

  server/src/
    services/audiobook.service.ts    # 교체: Remotion renderMedia() 호출
    routes/audiobook.routes.ts       # 수정: render, youtube 라우트 추가
```

### 데이터 흐름

1. 클라이언트에서 설정(비율/언어/TTS/BGM/자막) 구성
2. Remotion Player로 실시간 프리뷰 (브라우저에서 즉시)
3. "렌더링" 버튼 → 서버에서 `renderMedia()` 호출 → MP4 생성
4. 완성 MP4 → R2 업로드
5. (선택) YouTube 업로드 — 기존 OAuth2 + AI 메타 생성 재사용

## Remotion 컴포지션 구조

```
AudiobookComposition
  ├─ Sequence: CoverSlide (표지)
  │    ├─ KenBurnsSlide (표지 이미지)
  │    ├─ TypewriterSubtitle (제목)
  │    └─ SparkleParticles
  │
  ├─ Sequence: PageSlide × N (본문 페이지들)
  │    ├─ KenBurnsSlide (삽화)
  │    ├─ TypewriterSubtitle (본문 자막)
  │    ├─ SparkleParticles
  │    └─ Audio (TTS)
  │
  ├─ Sequence: EndingSlide (엔딩)
  │    ├─ KenBurnsSlide or 단색 배경
  │    └─ TypewriterSubtitle ("The End")
  │
  └─ Audio: BGM (전체 길이, 볼륨 조절)
```

### 장면 전환

- crossfade: `Sequence`의 `from` 값을 0.5초 겹치게 배치
- `interpolate()`로 opacity 0→1 / 1→0 트랜지션

### 지속시간 계산

```
페이지 duration = TTS duration + 0.5초 여유
TTS 없는 페이지 = 기본 3초
표지 = coverDuration (기존 설정값, 기본 3초)
crossfade 겹침 = 0.5초
총 길이 = Σ(각 페이지 duration) - (페이지수-1) × 0.5초
```

## 컴포넌트 상세

### KenBurnsSlide

정지 이미지에 줌인/줌아웃/패닝 애니메이션을 적용한다.

- 페이지마다 랜덤으로 방향 결정 (줌인→중앙, 줌아웃→중앙, 좌→우 패닝, 우→좌 패닝 등)
- `interpolate()`로 `scale`과 `translateX/Y`를 프레임 단위로 보간
- 이미지는 컨테이너보다 약간 크게 (scale 1.0~1.3) 배치하여 잘림 없이 움직임 표현
- `object-fit: cover`로 비율 유지

### TypewriterSubtitle

자막 텍스트가 한 글자씩 타이핑되는 효과.

- `useCurrentFrame()`으로 현재 프레임 기준 표시할 글자 수 계산
- 타이핑 속도: 분당 약 300자 (프레임당 계산)
- 위치: `subtitlePosition` (top/center/bottom)에 따라 배치
- 스타일: `subtitleColor`, `subtitleSize` 적용
- 반투명 배경 박스 (가독성)

### SparkleParticles

반짝이는 먼지/별 파티클 오버레이.

- Canvas 또는 absolute positioned div 기반
- 파티클 20~40개, 랜덤 위치/크기/투명도
- 천천히 떠다니는 모션 + 깜빡임 (opacity oscillation)
- `enableParticles` 설정으로 on/off

### CoverSlide / EndingSlide

- CoverSlide: 표지 이미지 + 제목 타이프라이터
- EndingSlide: 배경색 or 마지막 이미지 + "The End" 텍스트

## 클라이언트 UI

### AudiobookProjectCard 레이아웃

```
┌─────────────────────────────────────────┐
│ 프로젝트명                    [삭제]     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         Remotion Player             │ │
│ │       (실시간 프리뷰)                │ │
│ │    ▶ ──────────●──── 02:30         │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ▼ 설정                                  │
│   포맷: [YouTube ▾]  비율: [16:9 ▾]    │
│   언어: [한국어 ▾]                       │
│   페이지: [1] ~ [12]                    │
│   ☑ 표지 포함  지속시간: [3초]           │
│   ☑ TTS  ☑ BGM  ☑ 자막  ☑ 파티클       │
│   자막: 크기[24] 색상[#fff] 위치[하단]   │
│   BGM: [시스템 라이브러리 선택]          │
├─────────────────────────────────────────┤
│ [렌더링]  [다운로드]  [YouTube 업로드]   │
│ ████████████░░░░ 67% 렌더링 중...       │
└─────────────────────────────────────────┘
```

- 설정 변경 시 Player 프리뷰가 즉시 반영됨 (별도 "생성" 단계 없음)
- "렌더링" 버튼 → 서버 렌더링 → 진행률 표시
- 렌더링 완료 후 "다운로드" + "YouTube 업로드" 활성화

## 서버 렌더링

### 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/audiobooks/render` | Remotion 렌더링 시작 |
| GET | `/api/audiobooks/render-progress/:projectId` | 렌더링 진행률 폴링 |
| POST | `/api/audiobooks/youtube/upload` | YouTube 업로드 |
| POST | `/api/audiobooks/youtube/generate-meta` | AI 메타 생성 (Gemini) |
| GET | `/api/audiobooks/youtube/auth-url` | OAuth2 인증 URL |
| GET | `/api/audiobooks/youtube/status` | YouTube 연결 상태 |

### 렌더링 프로세스

1. Storybook 로드 → AudiobookRenderProps 변환
2. 이미지/TTS/BGM URL → 로컬 임시파일 다운로드
3. `bundle()` — Remotion 컴포지션을 webpack 번들 (첫 호출 시 캐싱)
4. `renderMedia()` — MP4 생성 (onProgress 콜백으로 진행률 추적)
5. MP4 → R2 업로드 (`storybooks/{id}/audiobook/{projectId}/output.mp4`)
6. storybook.audiobookProjects[].outputUrl에 저장

### YouTube 업로드

기존 `youtube.provider.ts` 재사용:
- OAuth2 토큰: R2 `system/youtube-tokens.json` (롱폼과 공유)
- AI 메타 생성: Gemini 프롬프트 프리셋 시스템 (롱폼과 공유)
- 썸네일: 표지 이미지 → sharp로 1280×720 JPEG 변환

## 데이터 모델 변경

### AudiobookProject (shared/types/storybook.ts)

```typescript
interface AudiobookProject {
  // 기존 유지
  id: string;
  name: string;
  format: 'youtube' | 'instagram-reel' | 'instagram-post' | 'custom';
  aspectRatio: '16:9' | '9:16' | '1:1';
  startPage: number;
  endPage: number;
  includeCover: boolean;
  coverDuration: number;
  includeTts: boolean;
  includeBgm: boolean;
  includeSubtitles: boolean;
  subtitleColor: string;
  subtitleSize: number;
  subtitlePosition: 'top' | 'center' | 'bottom';
  bgmUrl?: string;
  bgmVolume?: number;
  outputUrl?: string;

  // 제거: layout (Remotion은 항상 fullscreen + overlay)

  // 추가
  enableParticles?: boolean;           // 파티클 on/off (기본 true)
  youtubeUpload?: YouTubeUploadResult; // 롱폼과 동일한 타입 재사용
}
```

### AudiobookRenderProps (packages/remotion/src/types.ts)

```typescript
interface AudiobookSlide {
  imageUrl: string;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitleText?: string;
}

interface AudiobookRenderProps {
  slides: AudiobookSlide[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  cover?: { imageUrl: string; title: string; duration: number };
  bgmUrl?: string;
  bgmVolume?: number;
  subtitleStyle: {
    fontSize: number;
    color: string;
    position: 'top' | 'center' | 'bottom';
  };
  enableParticles?: boolean;
  fps?: number; // 기본 30
}
```

Storybook → AudiobookRenderProps 변환 헬퍼는 서버/클라이언트 각각에서 구현.
remotion 패키지 자체는 Storybook 타입에 의존하지 않음 (나중에 분리 가능).

## 의존성

### packages/remotion
- `remotion` — 코어
- `@remotion/cli` — 개발/미리보기 (devDependency)

### packages/client
- `@remotion/player` — 브라우저 프리뷰

### packages/server
- `@remotion/renderer` — 서버 렌더링
- `@remotion/bundler` — webpack 번들링
- Chrome/Chromium — Remotion이 Puppeteer로 프레임 캡처

## 제거 대상

- `packages/server/scripts/generate_audiobook.py` — Python 렌더링 스크립트
- MoviePy 관련 의존성 (오디오북용)
- `AudiobookProject.layout` 필드 사용처 (optional이므로 타입에서 제거만)

## 해상도

기존과 동일:
- `16:9` → 1280×720
- `9:16` → 720×1280
- `1:1` → 720×720
