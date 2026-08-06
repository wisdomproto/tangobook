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

- 🔴 **화면 잠금 방지 (`useWakeLock`, `@/lib/useWakeLock`, 2026-07-30)**: 뷰어는 나레이션(오디오)+이미지라 `<video>` 가 없어서, 유튜브와 달리 브라우저가 재생 중 화면을 끈다(사용자: "우리 동화 볼 때 자꾸 자동 화면 잠금"). ViewerContainer 최상단에서 `useWakeLock()` 로 Screen Wake Lock 을 잡는다(재생 여부 무관·단일/연속재생 공용). 탭 숨김→복귀 시 lock 이 자동 해제되므로 `visibilitychange` 로 재획득, API 없는 브라우저는 no-op. ⚠️ **자동 검증 불가**(패널 숨김 시 `request` 가 visibility 로 거부) — 태블릿 실측 필요.
- **진입 시 TTS+이미지 버퍼링** → 완료 전 Mascot reading "준비 중" 로딩(`ttsReady` 게이트). `waitForTts` 는 **첫 페이지만** + `canplay`(readyState≥3) 대기(나머지 풀 백그라운드). **게이트엔 첫 페이지 이미지 로드(`new Image` onload)도 포함** — 음성/자막만 먼저 나오고 이미지가 늦게 뜨는 것 방지(`Promise.all([waitForTts, 첫이미지])`). **자동 넘김(`handleTtsEnded`)도 다음 페이지 이미지 onload 후 넘김**(캐시면 즉시, 상한 1.2s) → 빈 장면 방지. 완료 후 첫 페이지 + 자동재생(300ms). video/games/파닉스(비story) 는 버퍼링 skip.
- TTS 끝나면 800ms 뒤 자동 페이지 넘김. **마지막 페이지** TTS 끝 or onNext → **RewardScreen/WordRevealScreen 오버레이** 표시(key_objects 있으면 WordReveal, 없으면 Reward). ⚠️ "BookDetailPage 자동 이동" 은 틀린 설명이었음(2026-07-01 정정).
- **프리로드 풀 + 🔴 단일 재생 엘리먼트 (2026-07-16 in-app 브라우저 fix)**: `preloadTts` 가 현재+다음 페이지 TTS 를 풀(url→Audio)에 적재해 **HTTP 캐시 워밍**만 담당. **`playTts` 는 항상 하나의 재사용 엘리먼트(`ttsRef`)로 재생**(`ttsRef.src` 스왑) — 페이지마다 풀의 다른 Audio 를 재생하면 **인스타그램 등 인앱 WebView 가 제스처로 해금된 그 엘리먼트만 재생 허용**해서 2페이지째 차단→`ended` 미발화→자동넘김 멈춤(크롬/PWA 는 관대). 정상 뷰어 모드엔 stall-guard 없음(playlist 모드만). 이미지는 다음 5페이지 `new Image()`. TTS 는 immutable Cache-Control(재방문 캐시). → memory `inapp-browser-tts-and-mobile-fixes-2026-07-16` · `viewer-tts-buffering-2026-06-09`.
- **⏸(autoPlayTts OFF) 게이트 (2026-06-12)**: 페이지 변경 자동재생 effect 가 `stateRef.current.autoPlayTts` 를 조건 + 타이머 발화 시점 양쪽에서 확인 — OFF 동안 페이지를 넘겨도 TTS 재생 안 되고, 전환 직후 ⏸ 눌러도 뒤늦게 재생되지 않음. deps 가 아닌 stateRef 로 읽는 이유: ON 토글 시 effect 재실행되면 `onTogglePlayback` 의 resume/play 와 이중 재생됨. `toggleBgm` 은 `play()` 성공 시에만 ON 표시(차단/실패 시 켜진 척 X).
- **▶ 토글 stale-resume 방어 (2026-07-02)**: `onTogglePlayback` ON 은 `lastPlayedTtsRef === currentTtsUrl` 일 때만 resume — ⏸ 상태로 페이지 넘기면 ttsRef 가 옛 페이지 오디오라 resume 하면 무음/엉뚱한 음성("자동재생 눌러도 TTS 안 나옴" 테스터 버그). 아니면 현재 페이지 playTts. `resumeTts` 도 play() 성공 시에만 재생 표시.
- **언어 토글 (2026-07-02)**: `onToggleLanguage` 첫 줄에서 `stopTts()` + `lastPlayedTtsRef=null` — 안 하면 재버퍼링 동안 옛 언어가 끝까지 재생("다음 페이지부터 바뀜"+음성·자막 언어 불일치).
- **전체화면 (기본 ON, 책마다 로컬 state)**: 탭 → 툴바+네비+진행률 오버레이 토글(4s auto-hide, `fsControls` — 컨트롤 컨테이너는 stopPropagation, playlist 모드 제외). 우상단 **상시 🏠 + ✕**. 레터박스는 같은 그림 blur cover 배경 레이어로 채움(PageView). 탭 게이트(needsTapToStart) 중엔 컨트롤 탭 비활성.
- **음량 3단계 (2026-07-02, 전역)**: `settings.volume: low(0.35)/mid(0.7)/high(1)` (`VOLUME_GAIN`) — TTS 직접, BGM 은 저작자 `backgroundMusicVolume` × 계수. 툴바 🔊→🔉→🔈 순환. `useAudioPlayer({ volumeGain })`, 재생 중에도 즉시 반영.
- 🔴 **기본 BGM 폴백 폐지 (2026-08-05)**: 저작 `backgroundMusicUrl` **없는 책은 조용하다**. 예전엔 `/sounds/bgm/default-{1..5}.mp3` 를 책 ID 해시로 깔았는데 나레이션 위에 계속 얹혀 시끄러웠다(사용자 판단). `bgmUrl = storybook?.backgroundMusicUrl` 뿐이라 `hasBgm=false` → 툴바 BGM 버튼 자동 비활성, `toggleBgm` 은 no-op. ⚠️ 같은 음원을 쓰는 **게임 장면 리빌(`SceneReveal`)·단어 상세 모달**은 볼륨 0.16 이라 **그대로 둔다**(2026-08-05 확인).
- **그림체 resolution**: `?style` → 없으면 **`defaultStyle`(대표)** → `artStyle` 폴백 (2026-07-02: 연속재생 등 style 미지정 진입이 라이브러리 표지와 같은 그림체로 재생).
- 🔴 **`embed?:{style, noAutoStart}` prop (2026-08-05)** — 랜딩(`/hangul`) 임베드 전용. `style`=그림체 강제(`urlStyle` 최우선, `?style`·`defaultStyle` 보다 앞), `noAutoStart`=`TitleIntro` 의 **5초 자동 시작 카운트다운(`AUTO_START_SECONDS`) 끄기**(탭해야만 재생). 뷰어 라우트는 옵셔널이라 무변경. `HangulBookTryIt` 이 `paper-craft` + 탭재생으로 쓴다.
- 홈 버튼 → `/library` · 뒤로 버튼 → 책 상세(`/library/:id`)
- **풀스크린 좌상단 뒤로가기 (2026-07-16)**: 컨트롤 숨김(풀스크린 기본) 상태에 **좌상단 상시 ← 버튼**(→`/library/:id` 책 상세) — 우상단 🏠✕ 와 대칭. 없으면 인앱 브라우저(인스타) 하단 뒤로 눌러 앱 이탈. `!playlist && !controlsVisible` 조건.

## 자막 시스템 (`PageSubtitle.tsx`)

- 문장 분할: `split(/(?<=[.!?…。！？」"'])\s+|\n+/)`
- 문장 단위로 화면 리셋 (이전 문장 지우고 새 문장)
- 문장 내에서 **단어(어절) progressive** — TTS `currentTime/duration` 비례
- **Fallback**: ttsDuration 없으면 `text.length / 7 (chars/sec)` 추정. `isTtsPlaying`인 동안 자체 interval(100ms)로 elapsed 누적
- 🔴 **줄바꿈 규칙은 글에 따라 다르다** (2026-07-29): `break-keep`(word-break: keep-all)은 **띄어쓰기가 있는 글**에만 맞다. 한국어는 낱말이 중간에 끊기는 걸 막아 주지만, **중국어처럼 공백이 없는 글은 문장 전체가 한 낱말로 취급돼 줄바꿈이 아예 안 되고 화면 밖으로 잘렸다**(신데렐라 zh 자막 실측). → `wrapClass(text)` = 공백 있으면 `break-keep`, 없으면 `break-words`(브라우저 기본 규칙). ⚠️ 줄바꿈(`
`)은 공백으로 치지 않는다 — zh 본문에도 `
` 은 있어서 그걸 세면 판정이 뒤집힌다. 브라우저 실측으로 `scrollWidth===clientWidth` 확인.
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
