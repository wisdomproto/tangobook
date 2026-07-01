# 연속재생 + 사이드바 정리 + 뷰어 전체화면 설계

**날짜**: 2026-07-01
**상태**: 설계 합의 (구현 대기)

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
- **큐 상태**: Zustand `playlist.store.ts` — `{ queue: {bookId, lang}[], index, speed, sleepMinutes, startedAt }`.
- `/continuous/play` 는 큐 스토어를 읽어 **현재 책**을 `ViewerContainer` 에 `playlistMode` 로 렌더.
- **ViewerContainer 변경 (최소 침습)**: `playlist?: { hasNext, onBookEnd }` prop 추가.
  - 마지막 페이지 도달 시: `playlist` 있으면 **`rewardOpen`/`wordRevealOpen` 오버레이 대신 `onBookEnd()` 호출**(다음 책 advance). 없으면 기존 동작 그대로.
  - `playlist` 모드면 `fullscreenImage` 강제 on.
- **advance**: `onBookEnd` → 스토어 `index++`. 다음 책 있으면 ViewerContainer가 새 bookId로 재렌더(자동재생 이어짐). 없으면 **종료 오버레이**(화면 어둡게 + "다 읽었어요" + [다시] / [나가기]).
- **컨트롤 바** (`ContinuousControls`, 하단/탭 시 노출):
  - 재생/일시정지 · **속도 0.75/1/1.25×**(TTS `audio.playbackRate`) · **슬립타이머 끄기/20/30분**(만료 시 정지+dim) · **다음 책 skip** · 진행("N권 중 M권") · 나가기.
- **fullscreen**: 플레이리스트는 항상 전체화면.

### 4.3 저장 (Supabase)
- 테이블 `playlists`: `id uuid pk, account_id uuid fk, name text, book_ids text[], language text, created_at, updated_at`. RLS 본인 CRUD(select/insert/update/delete own — 학습 이벤트 테이블과 동일 패턴, 클라 직접 supabase).
- 즉석 큐 = 저장 없이 스토어에만.
- 클라: `features/continuous/api/playlists.api.ts` + `hooks/usePlaylists.ts`(TanStack Query).

## 5. B. 사이드바 dev-only

- `AppShell` `PRIMARY_AXES`: 파닉스/어휘/게임 항목에 `devOnly: true` 표시. 렌더 시 `devOnly && !isDev` 면 제외.
- **isDev 판별**: `shared` 또는 client `config`에 `DEV_EMAILS = ['kil210@tangobook.co.kr']`. `useAuth().account?.email ∈ DEV_EMAILS` → isDev. 게스트/일반 = false.
- 결과: 일반/게스트 사이드바 = **동화책 · 연속재생**. 개발자 = + 파닉스 · 어휘 · 게임.
- 라우트/코드는 보존(숨김만). comingSoon 음영 로직은 dev 노출 항목엔 불필요(개발자는 실제 사용).

## 6. C. 뷰어 기본 전체화면

- `useViewerSettings` 의 `fullscreenImage` **기본값 true** (기존 persist 값이 있으면 존중; 최초/미설정 = true).
- 텍스트/컨트롤 토글은 유지 → 원하면 끄고 텍스트 볼 수 있음.
- "책 읽기"(BookDetail→/viewer)·연속재생 모두 전체화면 시작.
- ⚠️ persist 저장소에 기존 false가 박혀 있으면 기본값 바꿔도 안 바뀜 → 마이그레이션/기본 처리 확인 필요.

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

## 10. 미확정 (구현 중)
- 세트 개수/책 수 상한(예 세트당 20권) · 슬립타이머 옵션(20/30 고정 vs 커스텀) · 종료 후 화면(정지 vs 홈 복귀) · 빌더 그리드의 정렬/필터 범위.
