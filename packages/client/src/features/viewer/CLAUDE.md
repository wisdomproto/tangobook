# 뷰어 모듈

아이 혼자 태블릿 중심 사용. 학부모/교사용은 별도 앱으로 분리 예정. 모든 UI/UX 결정 기준은 [memory/viewer-target-user.md](../../../../../memory/viewer-target-user.md), 톤은 [memory/viewer-brand-tone.md](../../../../../memory/viewer-brand-tone.md).

## 폴더 구조

```
features/viewer/
  components/
    ViewerContainer.tsx     # 메인 뷰어 + 자동재생 + 5페이지 프리로드 + RewardScreen 오버레이
    ViewerToolbar.tsx       # 상단 Pill 툴바: 뒤로/홈 + 재생(TTS/BGM/AutoPlay) + 설정
    ViewerControls.tsx      # 좌우 64px 네비 (화면 세로 중앙)
    PageView.tsx            # framer-motion slide-fade, 이미지/자막 세로 스택
    PageSubtitle.tsx        # TTS 진행시간 기반 자막 (문장 단위 리셋 + 단어 progressive + fallback)
    BookSpineProgress.tsx   # 하단 책 등뼈 진행률 (dot, 중앙)
    MascotCorner.tsx        # BGM 재생 중 우하단 호리 dancing
    RewardScreen.tsx        # ?mode=video 진입 시 영상 모달 자동 오픈
    YouTubeModal.tsx        # youtube-nocookie.com 임베드 + ESC 닫기
    PhonicsViewer.tsx       # 파닉스 전용 (메뉴/학습/단어연습/게임)
    GameListViewer.tsx      # ?mode=games 게임 목록
    QuizViewer.tsx          # 퀴즈 뷰어
  hooks/
    useViewerSettings.ts    # tuple 반환: [settings, updateSettings]. 기본값: darkMode=true, autoPlayTts=true, textSize='md'
    useAudioPlayer.ts       # TTS/BGM: playTts/stopTts + ttsCurrentTime/ttsDuration/isTtsPlaying. timeupdate 동기화
    useSwipe.ts             # 스와이프 제스처
  lib/
    page-text.ts            # getPageText/getPageTtsUrl (lang fallback)
```

## 뷰어 동작

- 진입 시 항상 첫 페이지부터, **TTS 자동 재생**, 끝나면 800ms 뒤 자동 페이지 넘김
- **마지막 페이지** TTS 끝 or onNext 호출 → **BookDetailPage (`/library/:id`)로 자동 이동**
- **다음 5페이지 이미지·TTS 프리로드** (`new Image()` + `new Audio({preload:'auto'})`)
- 홈 버튼 → `/library` · 뒤로 버튼 → browser history back

## 자막 시스템 (`PageSubtitle.tsx`)

- 문장 분할: `split(/(?<=[.!?…。！？」"'])\s+|\n+/)`
- 문장 단위로 화면 리셋 (이전 문장 지우고 새 문장)
- 문장 내에서 **단어(어절) progressive** — TTS `currentTime/duration` 비례
- **Fallback**: ttsDuration 없으면 `text.length / 7 (chars/sec)` 추정. `isTtsPlaying`인 동안 자체 interval(100ms)로 elapsed 누적

## 라우팅 규칙 (ViewerContainer)

- `type === 'phonics' && mode !== 'story'` → PhonicsViewer
- `mode === 'games'` → GameListViewer
- `mode === 'video'` → RewardScreen → YouTubeModal
- 그 외 → 일반 동화책 뷰어

## 뷰어 디자인 시스템

- 토큰: `tailwind.config.js`의 cream/peach/coral/ink/darkbg + CSS vars
- **마스코트 호리(Hori)**: `<Mascot state="..." size="..." character="hori" />`
  - 자산: `public/mascot/hori/` — Lottie 5 + WebP 7
  - Lottie 5: idle/waving/cheering/celebrating/dancing (Bodymovin v5, PNG base64 embed, <40KB)
  - WebP 7: idle/waving/thinking/reading/pointing/sleeping/sad (1024×1024 q85, <90KB)
  - Fallback: Lottie → WebP → state별 이모지
  - URL 버전 쿼리 `?v=N`으로 캐시 무효화 (ASSET_VERSION 상수)
  - **등장**: LibraryPage(waving) · StateScreen(thinking/sad) · 뷰어 로딩(reading) · MascotCorner(dancing) · RewardScreen(celebrating)
- 공용 컴포넌트: Button, Card, Skeleton, StateScreen, ErrorBoundary, Mascot
- 라이브러리: 웰컴(마스코트) + 탭(3) + 검색 + 정렬 + 카테고리 칩 + aspect-video 16:9 카드 (3~4-col)
- 책 상세: `/library/:id` 16:9 표지 hero + 언어 탭 + 모드 카드 3개(읽기/영상/게임, 조건부)
- 언어 파라미터: `?lang=ko|en` + `getPageText/getPageTtsUrl` (fallback to base)
- 접근성: `useReducedMotion`, `focus-visible:ring`, 에러 문구 아이 친화, 터치 타겟 48+px

## 뷰어 플로우

```
LibraryPage (/library) → 카드 탭
  → BookDetailPage (/library/:id)   # 언어·모드 선택
    → "📖 책으로 읽기"
    → ViewerContainer (/viewer/:id?lang=ko)
       → TTS 자동재생 → 자막 → 자동 페이지 넘김 → 마지막 페이지
    → BookDetailPage 자동 복귀
```

언어 선택은 게임 목록 자동 필터링 (block/word-writing/speaking 등 언어 태그).
