# 동화게임 자산 프리로드 로딩 게이트 — 설계

- 날짜: 2026-07-09
- 상태: 설계 승인 대기 → 구현 계획 예정
- 범위: 동화책 학습게임(그림짝·블록·그림그리기·따라쓰기 4종) 및 어휘게임(`/games/vocab`, 동일 경로)

## 1. 문제

동화게임 첫 진입 시, 필요한 삽화·음원이 로컬(브라우저 HTTP) 캐시에 없으면 그때서야 다운로드하느라 렉이 생긴다. 특히:

1. 한글 정답 음원의 서버 concat 최초 합성(음절 다운로드 + ffmpeg + R2 업로드).
2. 큰 삽화 이미지 온디맨드 로드.
3. 정답 후 뜨는 **동화 장면 리빌(SceneReveal)의 삽화·나레이션** — 현재 어떤 프리페치에도 포함되지 않아 정답 순간에야 resolve된다. (단 SceneReveal은 **블록 게임 2종에만** 연결되어 있음 — §4 참조.)

기존 프리페치 인프라(`usePreloadImages`, `usePrewarmWordTts`, `usePrefetchUrlsGate`)는 이미 존재하지만 **전부 fire-and-forget**이라 완료를 기다리지 않고 게임이 즉시 시작된다. 이 훅들은 `{ ready }`를 **반환하지만 호출처가 사용하지 않는다**.

## 2. 목표 / 비목표

### 목표
- 게임 진입 시 **핵심 자산**(이번 판 단어 이미지 + 정답 TTS + 음절 mp3)이 준비될 때까지 진행률바를 보여주고, 준비되면 게임을 시작한다.
- 지금까지 프리페치에서 빠져 있던 **SceneReveal 삽화·나레이션**(블록 게임)을 게임 시작과 동시에 백그라운드로 워밍하기 시작한다(게이트에는 넣지 않음).
- 자산 URL 수집을 한 곳(`GameOverlay`)에 모아, 게임 플레이어는 "준비된 데이터만 받는다"는 단순 계약을 갖는다.

### 비목표
- IndexedDB 등 앱 레벨 영속 캐시 도입(R2가 이미 immutable HTTP 캐시라 불필요).
- 게이트를 "차단"으로 쓰는 것(자산 실패해도 게임은 항상 시작 — UX 최적화이지 게이트키핑 아님).
- 장면 리빌 자산까지 게이트에서 100% 대기(초기 로딩만 길어짐 — 백그라운드로 충분).

## 3. 결정 사항 (브레인스토밍 확정)

- **게이트 강도**: 핵심 자산만 대기. 장면 리빌은 백그라운드.
- **로딩 UX**: 진행률바만(마스코트 없음). 250ms 지연 표시.
- **적용 범위**: 동화게임 4종 + 어휘게임(같은 `VocabularyStudyContent` / `GameOverlay` 경로라 자동 커버).

## 4. 아키텍처

```
GameOverlay (VocabularyStudyContent 내)
  ├─ getGameData(unit, lang, game)                        ← 기존: items[].imageUrl 등 (동기)
  ├─ useStorybook(storybookId)                            ← GameOverlay로 끌어올림(장면 수집에 Storybook 객체 필요)
  ├─ usePhonicsMap()                                      ← { map, loading } (음절 URL lookup 소스)
  ├─ useGameAssetPreload({ gameData, unit, lang, style, book, phonicsMap, phonicsReady, game })
  │     내부:
  │       · collectSyncAssets(...)  → 이미지·음절·장면 URL (동기, book/map 있을 때)
  │       · resolveTtsAssets(...)   → 정답 TTS URL[] (비동기: resolveTtsUrl → 서버 concat)
  │     반환 { ready, loaded, total }  (core만 게이트, bg는 조용히 워밍)
  └─ ready ? <게임 플레이어 /> : <GameLoadingGate loaded total onSkip />
```

### 자산 분류
- **core (게이트 대상)**: `gameData.items[].imageUrl` + 정답 TTS URL[] + 음절 mp3 URL[](한글).
- **bg (백그라운드, 게이트 제외)**: 블록 게임(`kblock`/`eblock`)에 한해 각 단어의 SceneReveal 삽화(`illustrationUrl`) + 나레이션(`pageTtsUrl`). **따라쓰기·그림짝·점잇기는 장면을 안 띄우므로 bg 수집 대상 아님.**

### 컴포넌트/유닛 경계

- **`collectSyncAssets(gameData, lang, book, phonicsMap, game)`** — **순수 동기** 함수(부작용 없음). 게임 종류별로 필요한 **동기 계산 가능** URL을 안다.
  - 이미지: `gameData.items[].imageUrl`(또는 점잇기 `.originalImageUrl`).
  - 음절: 한글일 때 `phonicsMap`에서 단어별 음절 lookup(맵이 로드된 경우만; 없으면 빈 배열).
  - 장면(bg): 블록 게임일 때 `resolveSceneFromWord(word, lang, book, style)` — **동기 함수**(`resolve-scene.ts`, fetch 없음). `book`(Storybook 객체)이 있어야 계산 가능.
  - 반환: `{ images: string[], syllables: string[], sceneImages: string[], sceneNarrations: string[] }`.
  - 테스트: 모킹된 `gameData`/`book`/`phonicsMap` 만으로 검증 가능(부작용 없음).
- **`resolveTtsAssets(gameData, unit, lang)`** — **비동기** 함수. 판당 단어들에 대해 `resolveTtsUrl({ text, language, storybookId, directUrl, identifierPrefix })`를 호출해 정답 TTS URL을 확정한다.
  - ⚠️ 순수 함수 아님: `resolveTtsUrl`이 한글에서 `phonicsApi.concatPhonicsAudio`(서버가 음절 합성+R2 업로드하는 side-effect POST)를 트리거할 수 있음.
  - 테스트: `resolveTtsUrl`/`phonicsApi` 모킹 필요.
- **`useGameAssetPreload(args)`** — 워밍 실행 + 진행률 + 생명주기.
  - core URL 확정: 동기분(`collectSyncAssets`의 images+syllables)은 즉시, TTS는 `resolveTtsAssets` await 후 합류.
  - **phonics 맵 종속**: `phonicsReady`(= `!phonicsLoading`) 전에는 음절 URL을 못 뽑으므로, 맵 로드 완료를 기다렸다가 음절을 core에 합류시킨다(맵 로드 자체도 게이트에 포함). `phonicsMap` 변경 시 `useMemo`로 재수집.
  - `total` = 확정된 core 자산 수. 각 자산 load/decode 완료마다 `loaded++`.
  - 워밍 방식: 기존 `warmAudioUrl`(오디오 디코드 워밍)과 `new Image()`(이미지 디코드) **재사용**.
  - `ready` = `loaded === total` **또는** 6초 상한.
  - bg 자산은 `ready`와 무관하게 워밍(게임 시작 후에도 지속).
  - **생명주기**: 기존 훅과 동일하게 `alive` 가드로 언마운트 후 setState 금지 + 진행 중 워밍/bg 배치 포기. GameOverlay는 `key={activeGame}`으로 remount되므로 게임 전환 시 자동 재실행.
- **`GameLoadingGate`** — 진행률바 UI.
  - `loaded/total` 비율 바 + "바로 시작" 버튼.
  - **250ms 지연 표시**: 그 전에 `ready`면 렌더하지 않음(대부분 캐시 hit이라 깜빡임 방지).
  - 유아 대상 톤(부드러운 색), 마스코트 없음.

## 5. 데이터 플로우

1. 게임 카드 클릭 → `GameOverlay` 마운트 → `getGameData` 동기 생성 + `useStorybook`/`usePhonicsMap` 로드.
2. `useGameAssetPreload`:
   - 즉시: `collectSyncAssets`로 이미지 + (맵 로드됐으면)음절 + (블록게임+book 있으면)장면 URL 수집.
   - 비동기: `resolveTtsAssets`로 정답 TTS URL 확정 → core에 합류.
   - phonics 맵이 아직 로딩 중이면 음절은 맵 로드 후 합류(맵 로드도 게이트 포함).
3. `total` = 확정 core 개수, 완료마다 `loaded++`. `ready` = 전부 완료 또는 6초 상한.
4. bg(장면 삽화·나레이션)는 `ready`와 무관하게 워밍 지속.
5. 진행률바 = `loaded/total`. 250ms 안에 `ready`면 바 스킵.
6. `ready` → 실제 게임 플레이어 마운트(데이터 준비 완료 상태).

### 핵심 규칙
- **`warmed` localStorage 플래그로 게이트를 스킵하지 않는다.** 브라우저 캐시가 evict될 수 있어 false-positive → cold 다운로드. immutable 캐시된 자산은 `onload`/`canplaythrough`가 즉시 발화하므로 "항상 워밍하되 캐시된 건 즉시 통과" 패턴을 유지한다. (기존 훅 docstring에 "warmed면 즉시 ready"라는 impl과 모순된 낡은 계약이 있으니, 새 유닛으로 옮길 때 이 스킵 로직/Set/localStorage는 제거한다.)
- **CORS**: R2 pub 도메인은 `Access-Control-Allow-Origin`을 주지 않으므로, 워밍은 `fetch`가 아니라 `<img>`/`new Audio()` 엘리먼트 디코드로 한다(기존 `warmAudioUrl` 패턴 그대로).

## 6. 에러 처리

- **개별 자산 실패(404/타임아웃)**: 그 자산도 `loaded`로 카운트(막지 않음). 게임은 기존처럼 graceful(이미지 폴백, TTS 무음/Web Speech).
- **전체 상한 6초**: 느린 네트워크에서도 6초 후 무조건 시작. 로딩바에 "바로 시작" 버튼 제공.
- **핵심 자산 일부 실패해도 게임은 항상 시작** — 로딩 게이트는 차단이 아니라 UX 최적화.

## 7. 기존 코드 정리

- 게임 플레이어(`KoreanBlockPlayer`, `EnglishBlockPlayer`, `Korean/EnglishWordWritingPlayer`, `LineMatchingPlayer`, `ConnectTheDotsPlayer`) 내부의 fire-and-forget 프리페치 호출(`usePreloadImages`/`usePrewarmWordTts`/`usePrefetchUrlsGate`)은 `GameOverlay` 레벨 프리로드와 **중복**이 되므로 제거하거나, 게이트가 커버하는 자산에 한해 정리한다.
  - ⚠️ **회귀 주의**: 제거 전, 각 플레이어가 프리페치하던 자산이 새 게이트 core/bg에 **빠짐없이 포함**되는지 대조한다(특히 점잇기의 런타임 target, 블록 게임의 음절). 게이트가 커버 못 하는 자산은 플레이어에 남긴다.
  - `usePhonicsMap`의 맵 JSON 로드는 GameOverlay로 끌어올려 재사용(플레이어 중복 로드 제거). 단 맵은 캐시되므로 중복 로드는 저비용.
- 기존 훅에서 재사용할 순수 유틸(`warmAudioUrl`, 음절 lookup 로직)은 새 유닛이 import하여 재사용. 중복 구현하지 않는다.

## 8. 테스트

- **`collectSyncAssets`** — 게임 4종 × 한/영에 대해 올바른 이미지/음절/장면 URL 세트를 뽑는지 단위 테스트(모킹 gameData/book/phonicsMap). 부작용이 없어 순수 테스트 가능. 회귀 위험이 가장 큰 지점. 특히: 블록 게임만 장면 URL을 뽑는지, 맵 미로드 시 음절이 빈 배열인지.
- **`resolveTtsAssets`** — `resolveTtsUrl`/`phonicsApi` 모킹으로 판당 TTS URL 수집 검증.
- **`useGameAssetPreload`** — total 카운트, ready 전환, 6초 상한을 fake timer + 모킹 Image/Audio로 검증. 개별 실패가 `loaded`로 카운트되어 게이트를 막지 않는지, phonics 맵 로드 전후 음절 합류, 언마운트 시 setState 금지.
- **`GameLoadingGate`** — 250ms 전 완료 시 미표시, 진행률 렌더, "바로 시작" 동작.

## 9. 열린 질문

- ConnectTheDots(점잇기)는 target 해석이 런타임이라 TTS 프리워밍이 부분적일 수 있음 — core에서 가능한 만큼만 수집하고 나머지는 게임 내 기존 경로 유지(플레이어 프리페치 제거 대상에서 제외).
- 진행률 `total`에 음절 mp3를 포함할지(판당 음절 수가 많으면 total이 커져 바가 느리게 참) — 초기엔 포함하되, 체감 확인 후 음절은 bg로 내릴 수 있음(구현 후 실측 조정).
