# 연속재생 + 사이드바 정리 + 뷰어 전체화면 설계

**날짜**: 2026-07-01
**상태**: ✅ 구현 완료 (2026-07-01, `feat/continuous-play` → main). 플랜: [../plans/2026-07-01-continuous-play.md](../plans/2026-07-01-continuous-play.md). 후속=일시정지 배선.

## 1. 목표 / 비목표

**목표**: 부모가 동화책 여러 권을 골라 **자동으로 이어서 재생**(잠자리 등)할 수 있게 한다. 즉석 큐 + 저장 세트(원탭 반복). 부수로 사이드바를 일반 사용자에겐 단순화(개발자만 파닉스/어휘/게임)하고, 뷰어를 기본 전체화면으로 연다.

**비목표**: 오프라인 다운로드 재생, 세트 공유, 자동 추천 큐(수동 선택만).

## 2. 세 가지 작업

- **A. 연속재생** — 메인 신규 기능.
- **B. 사이드바 dev-only** — 파닉스/어휘/게임 axis를 개발자에게만 노출.
- **C. 뷰어 기본 전체화면** — `fullscreenImage` 기본 on.

관련성: B가 A의 진입 버튼을 담고, A의 재생은 뷰어(C 포함)를 재사용 → 한 스펙.

## 3. 재사용 (기존)

- `ViewerContainer` — `autoPlayTts`(자동재생) + 자동넘김 페이싱 + TTS 프리로드 풀 + 이미지 프리로드. **마지막 페이지 + autoPlayTts → `wordRevealOpen`(key_objects 있으면)/`rewardOpen`(RewardScreen) 오버레이.**
- `useViewerSettings` — `fullscreenImage`, `autoPlayTts` 등 뷰어 설정.
- `AppShell` `PRIMARY_AXES` — 좌측 사이드바 axis 배열.
- `page_read`/이벤트 로깅 — 연속재생 중에도 그대로 (각 책 읽기 이벤트 기록).

## 4. A. 연속재생

### 4.1 진입 & 화면
- **사이드바 axis 추가**: "연속재생"(coral 계열, `alwaysActive` 성격, 게스트 포함 노출). → `/continuous`.
- **`/continuous` (ContinuousHomePage)**:
  - **저장된 세트 목록** — 카드(세트명 + 책 수 + 표지 썸네일 몇 개) → 원탭 [재생]. 편집/삭제.
  - **[+ 새 세트 만들기]** → 빌더.
- **빌더 (ContinuousBuilder)**:
  - 라이브러리식 책 그리드에서 **다중선택**(체크/담기). 선택 순서 = 재생 순서, 드래그로 재정렬.
  - **언어 선택**(세트 단위, 기본 ko). 각 책은 default 그림체 사용.
  - [지금 재생] 또는 [세트 저장](이름 입력).

### 4.2 재생 (플레이리스트 모드) — `/continuous/play`
- **큐 상태**: Zustand `playlist.store.ts` — `{ queue: {bookId, lang}[], index, speed, sleepMinutes, paused }` + actions(next/skip/reset/setSpeed/setSleep). **스토어가 큐·컨트롤·슬립타이머의 단일 소유자.**
- `/continuous/play` 는 큐 스토어를 읽어 **현재 책**을 `<ViewerContainer key={currentBookId} playlist={...} />` 로 렌더.
  - **⚠️ `key={currentBookId}` 필수** — ViewerContainer는 `pageIndex`·`rewardOpen`·`wordRevealOpen`·`startedRef`·`lastEmittedPageRef` 등 내부 state를 가지므로, key 없이 storybookId만 바꾸면 다음 책이 이전 페이지 인덱스로 시작하고 page-0 이벤트가 dedup으로 누락된다. **책마다 remount** 하면 상태 리셋·이벤트 정상·startedRef 문제까지 한 번에 해결.
- **ViewerContainer 변경 — `playlist?: { hasNext: boolean; onBookEnd: () => void }` prop.** 마지막 페이지 → `onBookEnd()` 호출로 reward/wordReveal 오버레이를 **대체**. 가로채야 할 곳은 **3군데 전부**(리뷰 확인):
  1. `handleTtsEnded` (마지막 페이지 자동 도달) — `setTimeout(…,1000)` 우회하고 즉시 onBookEnd
  2. 수동 `onNext` (마지막 페이지에서 넘김)
  3. `?mode=video` 자동 오픈 effect — playlist 모드에선 무시
  - playlist 모드: `fullscreenImage` 강제 on, **✕ 전체화면 나가기 버튼 숨김**(아이가 눌러 플레이리스트 chrome 이탈 방지). 나가기는 컨트롤 바의 명시적 [나가기]만.
- **속도 조절 = `useAudioPlayer` 확장** (prop 전달 아님): `useAudioPlayer`에 `playbackRate` state + `setPlaybackRate` 추가하고, `playTts`·`preloadTts`가 만드는/재사용하는 모든 `Audio` 객체에 `el.playbackRate = rate` 적용(풀에 swap-in 될 때마다). BGM은 정상 속도 유지. ViewerContainer가 playlist speed를 이 세터로 전달.
- **advance**: `onBookEnd` → 스토어 `next()`. 다음 책 있으면 key 바뀌며 remount·자동재생 이어짐. 없으면 `PlaylistEndScreen`(dim + "다 읽었어요" + [다시]/[나가기]). **단일 책 큐도 종료 시 EndScreen 표시.**
- **무TTS/자동넘김 stall 방지** (correctness): 자동넘김은 `handleTtsEnded`로 구동되므로 페이지 TTS가 없는 책은 이벤트가 안 나 큐가 멈춘다. → playlist 모드에서 페이지 진입 후 **폴백 타이머**(예: 이미지 표시 + max(TTS 길이, N초) 뒤 자동 advance)로 무TTS/TTS 실패도 흐르게.
- **책 로드 실패 skip**: ViewerContainer가 자체 error StateScreen 을 그리면 playlist에서 dead-end 되므로, playlist 모드에선 로드 실패 시 `onBookEnd`(다음으로 skip) + 로그.
- **컨트롤 바** (`ContinuousControls`): 재생/일시정지 · 속도 0.75/1/1.25× · 슬립타이머 끄기/20/30분 · 다음 책 skip · 진행("N권 중 M권") · [나가기].
- **슬립타이머**: 스토어 소유. `sleepMinutes` 설정 시 스토어가 타이머 관리, 만료→정지+dim. **unmount·수동 나가기·재진입 시 반드시 clear**(프로젝트 setTimeout-audio-chain 버그 이력 준수 — [[feedback-tts-chain-rule]]).

### 4.3 저장 (Supabase)
- 테이블 `playlists`: `id uuid pk, account_id uuid references accounts(id) on delete cascade, name text, book_ids text[], language text, created_at, updated_at`. RLS `for all using (account_id = auth.uid())` (학습 이벤트/프로필 테이블과 동일 패턴, 클라 직접 supabase).
- 즉석 큐 = 저장 없이 스토어에만.
- 클라: `features/continuous/api/playlists.api.ts` + `hooks/usePlaylists.ts`(TanStack Query).

## 5. B. 사이드바 dev-only

- `AppShell` `PRIMARY_AXES`: 파닉스/어휘/게임 항목에 `devOnly: true` 표시. 렌더 시 `devOnly && !isDev` 면 제외.
- **isDev 판별**: client `config`에 `DEV_EMAILS = ['kil210@tangobook.co.kr']`. `useAuth().account?.email ∈ DEV_EMAILS` → isDev. 게스트/일반 = false. (`Account.email: string|null` 확인됨. ⚠️ AppShell 현재 `{activeProfile, session, signOut, isConfigured}`만 구조분해 → `account` 추가 필요.)
- 결과: 일반/게스트 사이드바 = **동화책 · 연속재생**. 개발자 = + 파닉스 · 어휘 · 게임.
- 라우트/코드는 보존(숨김만). comingSoon 음영 로직은 dev 노출 항목엔 불필요(개발자는 실제 사용).

## 6. C. 뷰어 기본 전체화면

- `useViewerSettings` 의 `fullscreenImage` **기본값 true**.
- ⚠️ **persist 마이그레이션 필수 (결정됨)**: `useViewerSettings`는 `localStorage['tangobook-viewer-settings']`를 `{...DEFAULT, ...parsed}` 머지 → 이미 뷰어를 연 사용자는 `fullscreenImage:false`가 고정돼 기본값 flip이 안 닿는다. → **설정에 `version` 키 추가**. 로드 시 저장된 version < 현재면 **`fullscreenImage`를 새 기본값(true)으로 1회 리셋**하고 version 갱신. (전체 설정 초기화 아님 — 이 필드만.)
- 텍스트/컨트롤 토글은 유지 → 원하면 끄고 텍스트 볼 수 있음.
- "책 읽기"(BookDetail→/viewer)·연속재생 모두 전체화면 시작.
- (참고) `features/viewer/CLAUDE.md`가 "마지막 페이지→BookDetailPage 자동 이동"으로 stale — 실제는 reward/wordReveal 오버레이. 구현 중 문서 정정.

## 7. 모듈 경계 (신규)

- `features/continuous/` — `pages/ContinuousHomePage.tsx`, `pages/ContinuousBuilder.tsx`, `pages/ContinuousPlayPage.tsx`, `store/playlist.store.ts`, `components/{PlaylistCard,BookMultiSelectGrid,ContinuousControls,PlaylistEndScreen}.tsx`, `api/playlists.api.ts`, `hooks/usePlaylists.ts`, `index.ts`.
- 변경: `AppShell.tsx`(axis+devOnly), `ViewerContainer.tsx`(playlist prop), `useViewerSettings.ts`(fullscreen 기본), `router/index.tsx`(3 라우트), `config`(DEV_EMAILS).
- Supabase: `playlists` 테이블 마이그.

## 8. 데이터 흐름 (재생)

```
사이드바 "연속재생" → /continuous (세트 목록)
  → 세트 원탭 or 새 세트 빌더 → playlist.store 에 queue 세팅 → /continuous/play
  → ViewerContainer(현재책, playlistMode) → 마지막페이지 → onBookEnd → index++
  → 다음책 or PlaylistEndScreen. 슬립타이머 만료 → 정지+dim.
```

## 9. 테스트

- `playlist.store`: advance(다음/끝), skip, 속도/슬립 설정, 즉석 큐 초기화.
- `usePlaylists`: CRUD (mock supabase).
- ViewerContainer playlist 모드: 마지막 페이지 → reward 대신 onBookEnd 호출(있을 때) / 없으면 기존 reward 동작(회귀 방지).
- 사이드바: isDev true/false/게스트 → axis 노출 차이.
- fullscreen 기본값.
- ContinuousControls: 속도·슬립·skip 콜백.

## 10. 설계 확정 (스펙 리뷰 반영)
- ✅ 책 전환 = `key={bookId}` remount · 속도 = `useAudioPlayer.playbackRate` 확장 · reward 가로채기 3곳 · 무TTS 폴백 타이머 · 로드실패 skip · 단일책도 EndScreen · 슬립타이머 store 소유+teardown · fullscreen version 마이그.

## 11. 미확정 (구현 중 확정 가능)
- 세트당 책 수 상한(기본 20권 가정) · 슬립타이머 옵션(끄기/20/30 고정) · 종료 후(정지+dim 기본, 홈 복귀 옵션) · 빌더 그리드 정렬/필터 범위 · 폴백 타이머 무TTS 페이지 표시 시간(기본 6초 가정).
