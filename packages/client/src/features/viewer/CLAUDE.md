# 뷰어 모듈

아이 혼자 태블릿 중심 사용. 학부모/교사용은 별도 앱으로 분리 예정. 모든 UI/UX 결정 기준은 [memory/viewer-target-user.md](../../../../../memory/viewer-target-user.md), 톤은 [memory/viewer-brand-tone.md](../../../../../memory/viewer-brand-tone.md).

## 폴더 구조

```
features/viewer/
  components/
    ViewerContainer.tsx     # 메인 뷰어 + 진입 TTS 버퍼링 로딩(ttsReady) + 자동재생 + 프리로드 풀 + RewardScreen 오버레이
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
    useAudioPlayer.ts       # TTS/BGM: playTts(프리로드 풀 재사용)/preloadTts/waitForTts/stopTts + ttsCurrentTime/ttsDuration/isTtsPlaying. timeupdate 동기화
    useSwipe.ts             # 스와이프 제스처
  lib/
    page-text.ts            # getPageText/getPageTtsUrl (lang fallback)
```

## 뷰어 동작

- **진입 시 TTS+이미지 버퍼링** → 완료 전 Mascot reading "준비 중" 로딩(`ttsReady` 게이트). `waitForTts` 는 **첫 페이지만** + `canplay`(readyState≥3) 대기(나머지 풀 백그라운드). **게이트엔 첫 페이지 이미지 로드(`new Image` onload)도 포함** — 음성/자막만 먼저 나오고 이미지가 늦게 뜨는 것 방지(`Promise.all([waitForTts, 첫이미지])`). **자동 넘김(`handleTtsEnded`)도 다음 페이지 이미지 onload 후 넘김**(캐시면 즉시, 상한 1.2s) → 빈 장면 방지. 완료 후 첫 페이지 + 자동재생(300ms). video/games/파닉스(비story) 는 버퍼링 skip.
- TTS 끝나면 800ms 뒤 자동 페이지 넘김. **마지막 페이지** TTS 끝 or onNext → **RewardScreen/WordRevealScreen 오버레이** 표시(key_objects 있으면 WordReveal, 없으면 Reward). ⚠️ "BookDetailPage 자동 이동" 은 틀린 설명이었음(2026-07-01 정정).
- **프리로드 풀**: `preloadTts` 가 현재+다음 페이지 TTS 를 풀(url→Audio)에 적재, `playTts` 가 풀 객체 **재사용**(이미 버퍼 → 즉시 재생, AbortController 리스너). 이미지는 다음 5페이지 `new Image()`. 같은 컴포넌트 풀이라 HTTP 캐시/CORS 의존 X. TTS 는 immutable Cache-Control(재방문 캐시). 상세 → memory `viewer-tts-buffering-2026-06-09`.
- **⏸(autoPlayTts OFF) 게이트 (2026-06-12)**: 페이지 변경 자동재생 effect 가 `stateRef.current.autoPlayTts` 를 조건 + 타이머 발화 시점 양쪽에서 확인 — OFF 동안 페이지를 넘겨도 TTS 재생 안 되고, 전환 직후 ⏸ 눌러도 뒤늦게 재생되지 않음. deps 가 아닌 stateRef 로 읽는 이유: ON 토글 시 effect 재실행되면 `onTogglePlayback` 의 resume/play 와 이중 재생됨. `toggleBgm` 은 `play()` 성공 시에만 ON 표시(차단/실패 시 켜진 척 X).
- **▶ 토글 stale-resume 방어 (2026-07-02)**: `onTogglePlayback` ON 은 `lastPlayedTtsRef === currentTtsUrl` 일 때만 resume — ⏸ 상태로 페이지 넘기면 ttsRef 가 옛 페이지 오디오라 resume 하면 무음/엉뚱한 음성("자동재생 눌러도 TTS 안 나옴" 테스터 버그). 아니면 현재 페이지 playTts. `resumeTts` 도 play() 성공 시에만 재생 표시.
- **언어 토글 (2026-07-02)**: `onToggleLanguage` 첫 줄에서 `stopTts()` + `lastPlayedTtsRef=null` — 안 하면 재버퍼링 동안 옛 언어가 끝까지 재생("다음 페이지부터 바뀜"+음성·자막 언어 불일치).
- **전체화면 (기본 ON, 책마다 로컬 state)**: 탭 → 툴바+네비+진행률 오버레이 토글(4s auto-hide, `fsControls` — 컨트롤 컨테이너는 stopPropagation, playlist 모드 제외). 우상단 **상시 🏠 + ✕**. 레터박스는 같은 그림 blur cover 배경 레이어로 채움(PageView). 탭 게이트(needsTapToStart) 중엔 컨트롤 탭 비활성.
- **음량 3단계 (2026-07-02, 전역)**: `settings.volume: low(0.35)/mid(0.7)/high(1)` (`VOLUME_GAIN`) — TTS 직접, BGM 은 저작자 `backgroundMusicVolume` × 계수. 툴바 🔊→🔉→🔈 순환. `useAudioPlayer({ volumeGain })`, 재생 중에도 즉시 반영.
- **그림체 resolution**: `?style` → 없으면 **`defaultStyle`(대표)** → `artStyle` 폴백 (2026-07-02: 연속재생 등 style 미지정 진입이 라이브러리 표지와 같은 그림체로 재생).
- 홈 버튼 → `/library` · 뒤로 버튼 → 책 상세(`/library/:id`)

## 자막 시스템 (`PageSubtitle.tsx`)

- 문장 분할: `split(/(?<=[.!?…。！？」"'])\s+|\n+/)`
- 문장 단위로 화면 리셋 (이전 문장 지우고 새 문장)
- 문장 내에서 **단어(어절) progressive** — TTS `currentTime/duration` 비례
- **Fallback**: ttsDuration 없으면 `text.length / 7 (chars/sec)` 추정. `isTtsPlaying`인 동안 자체 interval(100ms)로 elapsed 누적
- **inactive(TTS 정지/무음) = 페이지 전문 정적 표시** (2026-07-02) — 기존 빈 박스는 ⏸·무음 책·전체화면에서 "자막 안 보임" 원인이었음. progressive 는 재생 중에만.

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
       → RewardScreen 또는 WordRevealScreen 오버레이 (책 끝)
       → 사용자가 "홈" 탭 → /library  /  "다시 읽기" → 처음으로
```

언어 선택은 게임 목록 자동 필터링 (block/word-writing/speaking 등 언어 태그).

## playlist 모드 (`playlist` prop)

`<ViewerContainer playlist={{ hasNext, onBookEnd, speed, autoStart }} />` 를 전달하면 활성화.

- **마지막 페이지 3 interception site**: handleTtsEnded(site 1) / onNext(site 2) / ?mode=video 자동오픈(site 3) 모두 playlist 분기로 override → reward/wordReveal overlay 열지 않고 `onBookEnd()` 즉시 호출.
- **풀스크린 강제**: `const fullscreen = playlist ? true : settings.fullscreenImage`. ✕ 풀스크린 종료 버튼은 `!playlist` 조건으로 숨김.
- **속도 강제**: 마운트/speed 변경 시 `audio.setPlaybackRate(playlist.speed)` 적용.
- **로드 실패 skip**: `error && playlist` effect → `onBookEnd()` once (playlistSkippedRef 가드). 에러 화면 대신 "다음 책으로 이동 중..." 로딩 표시.
- **stall-guard**: TTS `ended` 이벤트가 `max(ttsDuration, 6s) + 900ms` 내에 미발화 시 자동 전진(또는 마지막 페이지면 onBookEnd). stallTimerRef 로 실제 ended 발화 시 취소하여 이중 호출 방지.
- **autoStart(2번째 이후 책)**: `playlist.autoStart===true` 면 `startedRef` 초기값을 `true` 로 세팅 → 탭-투-스타트("탭해서 시작하기") 게이트 skip 하고 버퍼링 완료 후 바로 자동재생. 브라우저 오디오 해금은 첫 책 탭으로 page-session 단위 유지되므로 새 제스처 불필요. 호출부는 `autoStart: index > 0` 전달(첫 책만 탭). autoStart 없으면(첫 책·일반 뷰어) 탭 게이트 그대로.
- **상태 초기화**: 호출부가 `<ViewerContainer key={bookId} />` 로 remount — 내부 상태 초기화 불필요.
