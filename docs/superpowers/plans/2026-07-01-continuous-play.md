# 연속재생 + 사이드바 dev-only + 뷰어 전체화면 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부모가 동화책 여러 권을 골라 자동으로 이어 재생(연속재생/잠자리)하게 하고, 사이드바를 일반 사용자에겐 단순화(개발자만 파닉스/어휘/게임), 뷰어를 기본 전체화면으로 연다.

**Architecture:** 재생은 기존 `ViewerContainer`를 `key={bookId}` 로 책마다 remount + `playlist` prop 으로 마지막 페이지 reward를 `onBookEnd`로 대체해 재사용. 큐/컨트롤/슬립타이머는 Zustand `playlist.store`가 단일 소유. 저장 세트는 Supabase `playlists`(RLS, 클라 직접) + TanStack Query. 속도조절은 `useAudioPlayer`에 `playbackRate` 확장.

**Tech Stack:** React 18 + TanStack Query v5 + Zustand v5 + Tailwind / Supabase(supabase-js) / Vitest.

**Spec:** [../specs/2026-07-01-continuous-play-design.md](../specs/2026-07-01-continuous-play-design.md)

**전제:** subagent-driven 실행. UI 카피 한국어, 코드/커밋 영어. 관련 파일만 커밋(레포에 무관한 미커밋 변경 있음 — `git add -A` 금지).

---

## Chunk 1: Supabase `playlists` 테이블 (마이그레이션)

**Files:** Create `packages/server/scripts/supabase-playlists.sql`. 적용은 컨트롤러가 Supabase MCP `apply_migration` 로 수행(구현자는 SQL만 작성, 적용 X).

```sql
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  book_ids text[] not null default '{}',
  language text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.playlists enable row level security;
drop policy if exists "own playlists" on public.playlists;
create policy "own playlists" on public.playlists
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create index if not exists idx_playlists_account on public.playlists(account_id);
```

- [ ] Step 1: SQL 파일 작성 (위 내용).
- [ ] Step 2: 컨트롤러에게 "적용 필요" 보고 (구현자는 적용하지 않음).
- [ ] Step 3: Commit `git add packages/server/scripts/supabase-playlists.sql && git commit -m "feat(continuous): playlists table schema + RLS"`.

---

## Chunk 2: 뷰어 기본 전체화면 + 설정 version 마이그 (item C)

**Files:** Modify `packages/client/src/features/viewer/hooks/useViewerSettings.ts`. Test: 같은 폴더 `useViewerSettings.test.ts`(신규).

배경: 이 훅은 `localStorage['tangobook-viewer-settings']`를 `{...DEFAULT_SETTINGS, ...parsed}` 로 머지(≈line 26). 이미 뷰어를 연 사용자는 `fullscreenImage:false`가 고정 → 기본값만 바꾸면 안 닿음. **settings version 도입**으로 1회 리셋.

- [ ] Step 1 (실패 테스트): 저장된 설정에 `version` 없음(또는 < CURRENT) + `fullscreenImage:false` → 로드 시 `fullscreenImage`가 true로 리셋되고 version 갱신. 이미 CURRENT version이면 사용자 값 존중(true→사용자가 false로 바꿔둔 건 유지).
- [ ] Step 2: 실패 확인 `pnpm --filter client exec vitest run src/features/viewer/hooks/useViewerSettings.test.ts`.
- [ ] Step 3: 구현 — `DEFAULT_SETTINGS.fullscreenImage = true`, `SETTINGS_VERSION = 2`(현재값+1). 로드 로직: parsed.version !== SETTINGS_VERSION 이면 `merged.fullscreenImage = DEFAULT_SETTINGS.fullscreenImage` 강제 + `merged.version = SETTINGS_VERSION` 후 저장. (다른 필드는 보존.)
- [ ] Step 4: 통과 확인.
- [ ] Step 5: Commit `feat(viewer): default fullscreen on + settings version migration`.

---

## Chunk 3: `useAudioPlayer` playbackRate 확장 (속도 조절 기반)

**Files:** Modify `packages/client/src/features/viewer/hooks/useAudioPlayer.ts`. Test: `useAudioPlayer.test.ts`(신규 또는 확장).

배경(리뷰): `playTts`(≈line 67 `pool.get(url) ?? new Audio(url)`)·`preloadTts`(≈line 133 `new Audio()`)가 Audio를 만들고, 페이지마다 pool에서 swap-in. 반환 API(≈232-244)에 rate 없음. → rate state + setter 추가, **모든 Audio 생성/재사용 지점에 `el.playbackRate = rate` 적용**. BGM 재생 경로는 건드리지 않음(정상 속도).

- [ ] Step 1 (실패 테스트): `setPlaybackRate(1.25)` 후 `playTts(url)` → 재생되는 Audio 요소의 `playbackRate === 1.25`. 기본은 1. 프리로드된 Audio도 playTts로 재생 시 현재 rate 적용. (Audio mock — jsdom Audio playbackRate 설정 가능. 필요 시 global Audio stub.)
- [ ] Step 2: 실패 확인.
- [ ] Step 3: 구현 — 훅 내부 `rateRef`(useRef, 리렌더 없이 최신값) + `setPlaybackRate(r)` (rateRef 갱신 + 현재 재생 중 el에도 반영). `playTts`에서 재생 직전 `el.playbackRate = rateRef.current`. `preloadTts`로 만든 el도 재생 시 playTts 경로를 타면 자동 적용(preload 시점엔 rate 무의미). 반환 객체에 `setPlaybackRate` 추가.
- [ ] Step 4: 통과 확인 + `pnpm --filter client exec tsc --noEmit`.
- [ ] Step 5: Commit `feat(viewer): useAudioPlayer playbackRate support`.

---

## Chunk 4: ViewerContainer `playlist` prop (재생 재사용의 핵심)

**Files:** Modify `packages/client/src/features/viewer/components/ViewerContainer.tsx`. Test: `ViewerContainer.playlist.test.tsx`(신규, 초점 좁게).

인터페이스: `playlist?: { hasNext: boolean; onBookEnd: () => void; speed: number }`.

가로채야 할 마지막-페이지 reward 경로 **3곳**(리뷰 확인):
1. `handleTtsEnded`(≈127-141): 마지막 페이지 자동 도달 → `setTimeout(…,1000)` 우회, `playlist` 있으면 즉시 `onBookEnd()`.
2. 수동 `onNext`(≈332-342): 마지막 페이지에서 넘김 → `playlist` 있으면 `onBookEnd()`.
3. `?mode=video` 자동 오픈 effect(≈363-367): playlist 모드면 무시.

추가 동작(playlist 있을 때):
- `fullscreenImage` 강제 on (설정과 무관, 렌더 시 override). ✕ 전체화면 나가기 버튼(≈481-490) 숨김.
- 속도: `useEffect`로 `playlist.speed` → `audio.setPlaybackRate`.
- **무TTS/자동넘김 stall 방지**: playlist 모드에서 각 페이지 진입 시 폴백 타이머 — TTS onEnded가 정상 경로. TTS URL 없거나 재생 실패 시 `max(추정, 6s)` 후 자동 next(또는 마지막이면 onBookEnd). (기존 자동넘김과 중복 발화 안 되게 guard.)
- **로드 실패 skip**: error StateScreen(≈383-391) 대신 playlist 모드면 `onBookEnd()` + `console.warn`.

- [ ] Step 1 (실패 테스트): playlist prop 주고 마지막 페이지 TTS 종료 → `onBookEnd` 호출됨, reward/wordReveal 오버레이 **안 뜸**. playlist 없으면 기존대로 reward 뜸(회귀). hasNext=false 여도 onBookEnd 호출(EndScreen은 상위가 처리).
- [ ] Step 2: 실패 확인.
- [ ] Step 3: 구현 (위 3 경로 + 부가 동작). 최소 침습 — 기존 non-playlist 경로는 손대지 않음(조건 분기만 추가).
- [ ] Step 4: 통과 + 기존 뷰어 테스트 회귀 없음 `pnpm --filter client exec vitest run src/features/viewer`.
- [ ] Step 5: `features/viewer/CLAUDE.md`의 stale 문구("마지막→BookDetailPage 자동 이동") 정정.
- [ ] Step 6: Commit `feat(viewer): playlist mode (onBookEnd intercept, fullscreen, speed, stall/fail guards)`.

---

## Chunk 5: playlist.store + 재생 페이지 + 컨트롤 + 종료화면

**Files:**
- Create `packages/client/src/features/continuous/store/playlist.store.ts`
- Create `packages/client/src/features/continuous/pages/ContinuousPlayPage.tsx`
- Create `packages/client/src/features/continuous/components/ContinuousControls.tsx`
- Create `packages/client/src/features/continuous/components/PlaylistEndScreen.tsx`
- Test: `store/playlist.store.test.ts`

**store** (Zustand): `{ queue: {bookId:string; lang:string}[]; index:number; speed:number; sleepMinutes:number|null; paused:boolean; sleepFiredAt:number|null }` + actions `setQueue(items,lang)`, `next()`(index++), `skip()`(=next), `reset()`, `setSpeed`, `setSleep`, `togglePause`, `stopBySleep()`. **슬립타이머는 store가 소유** — `setSleep(m)`이 이전 타이머 clear 후 신규 설정, 만료 시 `stopBySleep`. store에 `clearSleep()` 두고 페이지 unmount/나가기에서 호출.

- [ ] Step 1 (실패 테스트, store): setQueue → index 0 / next → index++ / 마지막에서 next → index === length(끝 신호) / skip 동일 / reset 초기화 / setSleep 후 clearSleep 시 타이머 없음(가짜 타이머 vi.useFakeTimers). setSpeed 반영.
- [ ] Step 2: 실패 확인 `pnpm --filter client exec vitest run src/features/continuous/store/playlist.store.test.ts`.
- [ ] Step 3: store 구현.
- [ ] Step 4: 통과 확인.
- [ ] Step 5: **ContinuousPlayPage** — store 읽어 `index >= queue.length` 면 `<PlaylistEndScreen>`, 아니면 `<ViewerContainer key={cur.bookId} storybookId={cur.bookId} ... playlist={{hasNext: index<queue.length-1, onBookEnd: next, speed}} />`. 하단 `<ContinuousControls>`. 큐 비었으면 `/continuous`로 리다이렉트. unmount 시 `clearSleep`.
- [ ] Step 6: **ContinuousControls** — 재생/일시정지·속도(0.75/1/1.25)·슬립(끄기/20/30)·다음책 skip·"N권 중 M권"·[나가기](→ reset + navigate('/continuous')). 탭하면 토글 노출(4-5세: 큰 버튼). Design tokens.
- [ ] Step 7: **PlaylistEndScreen** — dim 배경 + "다 읽었어요" + [다시](reset index=0)/[나가기]. 슬립 만료 시에도 이 화면(또는 정지 표시).
- [ ] Step 8: 렌더 스모크 테스트(컨트롤 버튼·EndScreen 카피) + tsc.
- [ ] Step 9: Commit `feat(continuous): playlist store + play page + controls + end screen`.

---

## Chunk 6: 저장 세트 (api/hook) + 홈 + 빌더 + 라우트

**Files:**
- Create `packages/client/src/features/continuous/api/playlists.api.ts` (supabase 직접 CRUD)
- Create `packages/client/src/features/continuous/hooks/usePlaylists.ts` (TanStack Query: list/create/update/delete + invalidate)
- Create `packages/client/src/features/continuous/pages/ContinuousHomePage.tsx`
- Create `packages/client/src/features/continuous/pages/ContinuousBuilder.tsx`
- Create `packages/client/src/features/continuous/components/{PlaylistCard,BookMultiSelectGrid}.tsx`
- Create `packages/client/src/features/continuous/index.ts`
- Modify `packages/client/src/router/index.tsx` (라우트 `/continuous`, `/continuous/new`, `/continuous/play`)
- Test: `hooks/usePlaylists.test.tsx` (mock supabase)

- [ ] Step 1 (실패 테스트): usePlaylists list/create/delete가 supabase from('playlists') 호출 + query invalidate. (mock supabase 빌더.)
- [ ] Step 2: 실패 확인.
- [ ] Step 3: playlists.api + usePlaylists 구현. supabase 미설정/게스트 시 빈 목록·no-op.
- [ ] Step 4: 통과 확인.
- [ ] Step 5: **ContinuousHomePage** (`/continuous`) — 저장 세트 카드 목록(원탭 → store.setQueue + navigate('/continuous/play')) + [+ 새 세트]. 빈 상태 카피.
- [ ] Step 6: **BookMultiSelectGrid** — 라이브러리식 그리드(공개 책, 표지+제목), 탭=선택/해제, 선택 순서 배지. 데이터는 기존 storybooks 목록 훅 재사용(라이브러리와 동일 소스).
- [ ] Step 7: **ContinuousBuilder** (`/continuous/new`) — BookMultiSelectGrid + 순서 조정 + 언어 선택 + [지금 재생](store.setQueue→/play) / [세트 저장](이름 입력 → create).
- [ ] Step 8: 라우트 등록(AppShell 밖 풀스크린 성격 — /continuous/play는 특히). tsc + 렌더 스모크.
- [ ] Step 9: Commit `feat(continuous): saved sets api/hook + home + builder + routes`.

---

## Chunk 7: 사이드바 "연속재생" axis + dev-only (item B)

**Files:** Modify `packages/client/src/components/AppShell.tsx`. Create `packages/client/src/config/dev.ts` (`DEV_EMAILS`). Test: `AppShell.test.tsx`(신규 또는 확장, 초점: axis 노출).

- [ ] Step 1: `config/dev.ts` — `export const DEV_EMAILS = ['kil210@tangobook.co.kr']; export const isDevEmail = (e?: string|null) => !!e && DEV_EMAILS.includes(e);`
- [ ] Step 2 (실패 테스트, AppShell): 게스트/일반 계정 → 사이드바에 파닉스/어휘/게임 **없음**, "동화책"+"연속재생"만. dev 이메일 계정 → 파닉스/어휘/게임 노출. (useAuth mock account.email 변경.)
- [ ] Step 3: 실패 확인.
- [ ] Step 4: 구현 — `PRIMARY_AXES`에 `연속재생`(to `/continuous`, coral, alwaysActive) 추가 + 파닉스/어휘/게임에 `devOnly:true`. AppShell useAuth 구조분해에 `account` 추가. 렌더 전 `PRIMARY_AXES.filter(a => !a.devOnly || isDevEmail(account?.email))`.
- [ ] Step 5: 통과 확인.
- [ ] Step 6: Commit `feat(nav): continuous-play sidebar entry + dev-only phonics/vocab/games`.

---

## 최종 검증
- [ ] `pnpm typecheck` (전 패키지) PASS
- [ ] `pnpm --filter client test` — 신규 테스트 green, 기존 회귀 없음(사전 실패 10건은 main과 동일 — 무관).
- [ ] 수동 QA: 사이드바 연속재생 → 새 세트(책 3권) → 재생(자동 이어짐·속도·슬립·skip·전체화면) → 큐 끝 EndScreen. 세트 저장 → 홈 원탭 재생. 일반계정 사이드바에 파닉스/어휘/게임 안 보임. 책 읽기 진입 시 전체화면 기본.
- [ ] "업데이트 하자"(CLAUDE.md·memory·spec/plan·commit·push).

## 미확정 (구현 중)
- 세트당 책 수 상한(20) · 슬립 옵션(끄기/20/30) · 폴백 타이머(6초) · 종료 후(정지 vs 홈).
