# 동화게임 자산 프리로드 로딩 게이트 — 설계

- 날짜: 2026-07-09
- 상태: 설계 승인 대기 → 구현 계획 예정
- 범위: 동화책 학습게임(그림짝·블록·그림그리기·따라쓰기 4종) 및 어휘게임(`/games/vocab`, 동일 경로)

## 1. 문제

동화게임 첫 진입 시, 필요한 삽화·음원이 로컬(브라우저 HTTP) 캐시에 없으면 그때서야 다운로드하느라 렉이 생긴다. 특히:

1. 한글 정답 음원의 서버 concat 최초 합성(음절 다운로드 + ffmpeg + R2 업로드).
2. 큰 삽화 이미지 온디맨드 로드.
3. 정답 후 뜨는 **동화 장면 리빌(SceneReveal)의 삽화·나레이션** — 현재 어떤 프리페치에도 포함되지 않아 정답 순간에야 resolve된다.

기존 프리페치 인프라(`usePreloadImages`, `usePrewarmWordTts`, `usePrefetchUrlsGate`)는 이미 존재하지만 **전부 fire-and-forget**이라 완료를 기다리지 않고 게임이 즉시 시작된다. 이 훅들은 `{ ready }`를 **반환하지만 호출처가 사용하지 않는다**.

## 2. 목표 / 비목표

### 목표
- 게임 진입 시 **핵심 자산**(이번 판 단어 이미지 + 정답 TTS + 음절 mp3)이 준비될 때까지 진행률바를 보여주고, 준비되면 게임을 시작한다.
- 지금까지 프리페치에서 빠져 있던 **SceneReveal 삽화·나레이션**을 게임 시작과 동시에 백그라운드로 워밍하기 시작한다(게이트에는 넣지 않음).
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
  ├─ getGameData(unit, lang, game)                       ← 기존: items[].imageUrl 등
  ├─ collectGameAssets(gameData, unit, lang, style)      ← 신규(순수/비동기): URL 수집
  │     · core (gate)  : 단어 이미지 URL[] + 정답 TTS URL[] + 음절 mp3 URL[]
  │     · bg   (non-gate): 각 단어 SceneReveal 삽화 + 나레이션 URL[]
  ├─ useGameAssetPreload(coreUrls, bgUrls)               ← 신규 훅
  │     반환 { ready, loaded, total }  (core만 게이트, bg는 조용히 워밍)
  └─ ready ? <게임 플레이어 /> : <GameLoadingGate loaded total onSkip />   ← 신규 UI
```

### 컴포넌트/유닛 경계

- **`collectGameAssets`** — 순수/비동기 유틸. 게임 종류별로 어떤 URL이 필요한지 아는 **유일한 곳**.
  - 입력: `gameData`, `unit`, `lang`, `style`(preferredStyle).
  - 출력: `{ core: string[], bg: string[] }`. 이미지/음절은 동기 수집 가능, TTS·장면은 `resolveTtsUrl` / `resolveSceneFromWord`가 비동기라 내부에서 await하여 URL로 확정.
  - 의존: `resolveTtsUrl`, `resolveSceneFromWord`, `usePhonicsMap`의 음절 lookup 로직(순수 부분 추출).
- **`useGameAssetPreload(coreUrls, bgUrls)`** — 워밍 실행 + 진행률.
  - 기존 `warmAudioUrl`(오디오 디코드 워밍)과 `new Image()`(이미지 디코드)를 재사용.
  - `total` = core 자산 수. 각 자산 load/decode 완료마다 `loaded++`.
  - `ready` = `loaded === total` **또는** 6초 상한.
  - bg 자산은 `ready`와 무관하게 계속 워밍.
  - 의존: 없음(자산 URL 배열만).
- **`GameLoadingGate`** — 진행률바 UI.
  - `loaded/total` 비율 바 + "바로 시작" 버튼.
  - **250ms 지연 표시**: 그 전에 `ready`면 렌더하지 않음(대부분 캐시 hit이라 깜빡임 방지).
  - 유아 대상 톤(부드러운 색), 마스코트 없음.

## 5. 데이터 플로우

1. 게임 카드 클릭 → `GameOverlay` 마운트 → `getGameData` 동기 생성.
2. `collectGameAssets`가 core/bg URL 세트 생성(TTS·장면은 await로 URL 확정).
3. `useGameAssetPreload`:
   - `total` = core 개수, 완료마다 `loaded++`.
   - `ready` = 전부 완료 또는 6초 상한.
   - bg는 `ready`와 무관하게 워밍(게임 시작 후에도 지속).
4. 진행률바 = `loaded/total`. 250ms 안에 `ready`면 바 스킵.
5. `ready` → 실제 게임 플레이어 마운트(데이터 준비 완료 상태).

### 핵심 규칙
- **`warmed` localStorage 플래그로 게이트를 스킵하지 않는다.** 브라우저 캐시가 evict될 수 있어 false-positive → cold 다운로드. immutable 캐시된 자산은 `onload`/`canplaythrough`가 즉시 발화하므로 "항상 워밍하되 캐시된 건 즉시 통과" 패턴을 유지한다.
- **CORS**: R2 pub 도메인은 `Access-Control-Allow-Origin`을 주지 않으므로, 워밍은 `fetch`가 아니라 `<img>`/`new Audio()` 엘리먼트 디코드로 한다(기존 `warmAudioUrl` 패턴 그대로).

## 6. 에러 처리

- **개별 자산 실패(404/타임아웃)**: 그 자산도 `loaded`로 카운트(막지 않음). 게임은 기존처럼 graceful(이미지 폴백, TTS 무음/Web Speech).
- **전체 상한 6초**: 느린 네트워크에서도 6초 후 무조건 시작. 로딩바에 "바로 시작" 버튼 제공.
- **핵심 자산 일부 실패해도 게임은 항상 시작** — 로딩 게이트는 차단이 아니라 UX 최적화.

## 7. 기존 코드 정리

- 게임 플레이어(`KoreanBlockPlayer`, `EnglishBlockPlayer`, `Korean/EnglishWordWritingPlayer`, `LineMatchingPlayer`, `ConnectTheDotsPlayer`) 내부의 fire-and-forget 프리페치 호출(`usePreloadImages`/`usePrewarmWordTts`/`usePrefetchUrlsGate`)은 `GameOverlay` 레벨 프리로드와 **중복**이 되므로 제거하거나, 게이트가 커버하는 자산에 한해 정리한다.
  - 단, `usePhonicsMap`의 맵 JSON 로드(`audioReady = !phonicsLoading` 게이트)는 별개로 유지(맵이 있어야 음절 URL을 lookup).
- 기존 훅에서 재사용할 순수 유틸(`warmAudioUrl`, 음절 lookup)은 `collectGameAssets`/`useGameAssetPreload`가 import하여 재사용. 중복 구현하지 않는다.

## 8. 테스트

- **`collectGameAssets`** — 게임 4종 × 한/영에 대해 올바른 core/bg URL 세트를 뽑는지 단위 테스트(모킹 unit/gameData). 회귀 위험이 가장 큰 지점.
- **`useGameAssetPreload`** — total 카운트, ready 전환, 6초 상한을 fake timer + 모킹 Image/Audio로 검증. 개별 실패가 `loaded`로 카운트되어 게이트를 막지 않는지.
- **`GameLoadingGate`** — 250ms 전 완료 시 미표시, 진행률 렌더, "바로 시작" 동작.

## 9. 열린 질문

- ConnectTheDots(점잇기)는 target 해석이 런타임이라 TTS 프리워밍이 부분적일 수 있음 — core에서 가능한 만큼만 수집하고 나머지는 게임 내 기존 경로 유지.
- 진행률 `total`에 음절 mp3를 포함할지(판당 음절 수가 많으면 total이 커져 바가 느리게 참) — 초기엔 포함하되, 체감 확인 후 음절은 bg로 내릴 수 있음(구현 후 실측 조정).
