# 로그인/계정 시스템 — 스펙

**Date**: 2026-04-23
**스코프**: 뷰어 전용 부모 계정 + 자녀 프로필 시스템. Supabase Auth + Postgres. 학습 이벤트 수집·리포팅·뱃지·포인트는 **이후 별도 스펙**.
**상위 목표**: 학습 리포팅의 전제인 "누구의" 구분을 확보. 1~2년 내 수만 단위 확장을 염두.

## 0. 컨텍스트

이 스펙은 더 큰 "학습 현황 리포팅" 이니셔티브의 **첫 번째 서브시스템**.

전체 의존 그래프:
```
1. 로그인/계정 ─┐                                                  (이번 스펙)
               ├─► 2. 학습 이벤트 수집 ─► 3. 어휘 마스터리 예측 ─► 4. 리포팅 UI
               │
               ├─► 5. 뱃지/포인트 ─► 6. 포인트 gated 기능
               │
               └─► 7. 파닉스↔동화책 어휘 매핑 (3 정확도 향상)
```

이번 스펙 한정: 부모 회원가입·로그인·자녀 프로필·PIN·마이그레이션. 학습 이벤트 테이블 shell만 선언.

## 1. 설계 결정 (브레인스토밍 확정)

| 결정 | 선택 |
|---|---|
| 계정 주체 | **부모 계정 + 자녀 프로필** (Netflix Kids 모델, 최대 4명) |
| 인증 방식 | Email + Password + Google OAuth |
| 인증/DB 백엔드 | **Supabase** (Auth + Postgres + RLS) |
| 로그인 강제? | 선택적 — 게스트도 뷰어 사용 가능, 로그인 시 리포트·뱃지 언락 |
| 프로필 필드 | 이름 + 아바타 + 생년월일. 최대 4명 |
| 부모 영역 보호 | 4자리 PIN 필수. 15분 sessionStorage memoize. 이메일 리셋 |
| 저작도구 스코프 | 이번 스펙 **제외** (현 무인증 유지) |

## 2. 아키텍처

### 2.1 개관

Supabase가 **부모 계정·자녀 프로필·PIN·학습 이벤트 DB**를 전담. 탱고북 기존 Express 서버는 **Storybook 콘텐츠 저장을 계속 담당**. 두 시스템은 UI에서만 합류. 클라이언트는 `@supabase/supabase-js` SDK로 Supabase에 직접 쿼리(RLS로 보호), 기존 `/api/*` 호출은 그대로.

이번 스펙에서 서버(Express)는 변경 없음. 이후 스펙들이 서버 사이드 이벤트 sync·집계 cron 추가.

### 2.2 의존성 · 환경변수

- 클라 신규 패키지: `@supabase/supabase-js`
- 환경변수 신규:
  - `VITE_SUPABASE_URL` (클라)
  - `VITE_SUPABASE_ANON_KEY` (클라)
- **Graceful degradation**: 두 env var가 모두 설정돼야 로그인 기능 활성. 없으면 `ParentCornerButton` 숨기고 게스트 모드만 동작 — Railway에 env 설정 전에도 배포 가능.

### 2.3 파일 맵

```
packages/client/src/
  lib/
    supabase.ts                                # createClient 싱글톤 + isConfigured 플래그
  features/
    auth/
      api/
        auth.api.ts                            # signUp/signIn/OAuth/signOut/resetPassword/setPin/verifyPin
        profiles.api.ts                        # list/create/update/delete 자녀 프로필
      hooks/
        useSession.ts                          # supabase session + 파생 상태
        useCurrentAccount.ts                   # 부모 계정 + profiles 배열 (TanStack Query)
        useActiveProfile.ts                    # 선택된 자녀 프로필 (localStorage + context)
        useParentGate.ts                       # PIN 15분 memoize + 3회 lockout
      components/
        LoginPage.tsx                          # /login 페이지 컨테이너 (SignIn/SignUp 탭)
        SignInForm.tsx
        SignUpForm.tsx
        SetPinStep.tsx                         # 가입 후 PIN 설정 강제 스텝
        ProfileCreateStep.tsx                  # 가입 후 첫 자녀 프로필 강제 생성
        ProfilePicker.tsx                      # "누가 놀고 있어요?" 아바타 그리드
        ProfileCreateModal.tsx                 # 자녀 추가/편집
        ParentGateModal.tsx                    # PIN 입력 오버레이
        PinPad.tsx                             # 공용 4칸 PIN 키패드
        AvatarPicker.tsx                       # 8종 아바타 그리드
        ParentCornerButton.tsx                 # 🔒 우상단 버튼
      guards/
        RequireAuthed.tsx                      # 라우트 가드 — 세션 필요
        RequireAuthedWithPin.tsx               # 세션 + hasPin + PIN 통과
      context/
        AuthContext.tsx                        # SessionProvider + ActiveProfileProvider
      lib/
        migrations.ts                          # localStorage → Supabase 이관 (플러그인 레지스트리)
        avatars.ts                             # AVATAR_IDS 상수 + fallback 이모지 맵
      index.ts

  pages/
    LoginPage.tsx                              # auth/components/LoginPage re-export
    ParentHomePage.tsx                         # /parent shell
    ParentProfilesPage.tsx                     # /parent/profiles
    ParentSettingsPage.tsx                     # /parent/settings
  pages/LibraryPage.tsx                        # [수정] ParentCornerButton + activeProfile 배지
  router/index.tsx                             # [수정] /login, /login/callback, /parent/*
  main.tsx                                     # [수정] AuthProvider 래핑

packages/shared/src/types/
  auth.ts                                      # Account, ChildProfile, AvatarId, LearningEvent

scripts/
  supabase-setup.sql                           # 테이블·RLS·트리거·RPC 전체 (Supabase SQL editor에 1회 실행)

packages/client/.env.local.example             # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설명
```

### 2.4 라우트 구조

```
/                        # 저작도구 (변경 없음)
/library                 # 뷰어 홈 (+ ParentCornerButton)
/library/:id             # 책 상세 (변경 없음)
/viewer/:id              # 뷰어 (변경 없음)
/login                   # 로그인/가입 페이지
/login/callback          # Supabase OAuth 리다이렉트 handler
/parent                  # 부모 영역 hub (RequireAuthedWithPin)
/parent/profiles         # 자녀 프로필 관리
/parent/settings         # PIN 변경·로그아웃·계정 삭제
```

## 3. 데이터 모델

### 3.1 Supabase 테이블 (`scripts/supabase-setup.sql`)

```sql
-- 부모 계정 (auth.users와 1:1)
create table accounts (
  id uuid references auth.users on delete cascade primary key,
  email text,
  pin_hash text,                 -- bcrypt via pgcrypto crypt()
  pin_set_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 자녀 프로필 (1 account : N children, max 4 app-level)
create table child_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  name text not null check (length(trim(name)) between 1 and 10),
  avatar_id text not null,       -- 'hori' | 'dino' | 'rabbit' | ...
  birth_date date,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 학습 이벤트 shell (스키마 선언, write는 다음 스펙부터)
create table learning_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references child_profiles(id) on delete cascade not null,
  event_type text not null,      -- 'word_spoken' | 'page_read' | 'game_completed' | ...
  storybook_id text,
  game_type text,
  word text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index idx_learning_events_profile on learning_events(profile_id, created_at desc);
create index idx_learning_events_word on learning_events(word) where word is not null;
create index idx_child_profiles_account on child_profiles(account_id);
```

### 3.2 RLS 정책

```sql
alter table accounts enable row level security;
alter table child_profiles enable row level security;
alter table learning_events enable row level security;

create policy "account_self_select" on accounts for select using (auth.uid() = id);
create policy "account_self_update" on accounts for update using (auth.uid() = id);

create policy "child_self_all" on child_profiles for all using (account_id = auth.uid());

create policy "event_self_all" on learning_events for all using (
  exists (
    select 1 from child_profiles cp
    where cp.id = learning_events.profile_id and cp.account_id = auth.uid()
  )
);
```

> `accounts.insert` 정책은 의도적으로 없음 — 계정 row는 **trigger**로만 생성.

### 3.3 PIN 해싱 (pgcrypto RPC)

```sql
create extension if not exists pgcrypto;

create or replace function set_pin(raw_pin text) returns void
language sql security definer as $$
  update accounts
    set pin_hash = crypt(raw_pin, gen_salt('bf')),
        pin_set_at = now(),
        updated_at = now()
  where id = auth.uid();
$$;

create or replace function verify_pin(raw_pin text) returns boolean
language sql security definer as $$
  select coalesce(pin_hash = crypt(raw_pin, pin_hash), false)
  from accounts where id = auth.uid();
$$;

-- 권한: 로그인된 사용자만 호출 가능
revoke all on function set_pin(text) from public;
revoke all on function verify_pin(text) from public;
grant execute on function set_pin(text) to authenticated;
grant execute on function verify_pin(text) to authenticated;
```

> PIN 평문은 **클라 ↔ RPC 호출 순간**에만 존재. DB엔 bcrypt hash만. `SECURITY DEFINER` + `auth.uid()` 내부 참조로 다른 계정 접근 불가.

### 3.4 계정 자동 생성 트리거 + 트리거 race 대응

```sql
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into accounts (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**트리거 race 대응 (클라 측)**: 드물게 `exchangeCodeForSession` 직후 `accounts` SELECT가 0 row 반환 가능성(복제 지연·트리거 지연). `useCurrentAccount`가 빈 결과를 받으면 **자동 client-side insert fallback** 수행:

```ts
// account가 null인데 session은 있음 → 수동 upsert
if (!account && session) {
  await supabase.from('accounts').upsert(
    { id: session.user.id, email: session.user.email },
    { onConflict: 'id' }
  );
  await refetch();
}
```

`upsert`는 RLS에 막히지 않음 (`auth.uid() = id` 조건 충족). 재시도 1회 후에도 실패하면 "계정 준비 중…" 표시 + 3초 후 자동 refetch.

### 3.5 자녀 프로필 최대 4명 — DB 레벨 CHECK

앱 단 검증 외 추가 방어:

```sql
create or replace function enforce_child_limit() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from child_profiles where account_id = new.account_id) >= 4 then
    raise exception 'child_profiles max 4 per account';
  end if;
  return new;
end;
$$;

create trigger child_profiles_limit_trigger
  before insert on child_profiles
  for each row execute function enforce_child_limit();
```

클라 UI에서 `+` 버튼을 숨겨 정상 경로는 도달 못 하지만, RLS 우회·버그 방지.

### 3.6 계정 삭제 RPC — `delete_self_account`

```sql
create or replace function delete_self_account() returns void
language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- child_profiles, learning_events은 ON DELETE CASCADE로 자동 삭제
  delete from accounts where id = uid;

  -- auth.users 행도 삭제 (SECURITY DEFINER 필요)
  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_self_account() from public;
grant execute on function delete_self_account() to authenticated;
```

클라는 `await supabase.rpc('delete_self_account')` 호출 후 `supabase.auth.signOut()` + `/library`로 navigate.

### 3.5 TypeScript 타입 (`packages/shared/src/types/auth.ts`)

```ts
export const AVATAR_IDS = [
  'hori', 'dino', 'rabbit', 'bear', 'cat', 'dog', 'penguin', 'fox',
] as const;
export type AvatarId = typeof AVATAR_IDS[number];

export interface Account {
  id: string;
  email: string | null;
  hasPin: boolean;             // 클라 파생: pin_hash !== null
  pinSetAt: string | null;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  accountId: string;
  name: string;                // 1~10자
  avatarId: AvatarId;
  birthDate: string | null;    // ISO YYYY-MM-DD
  lastActiveAt: string | null;
  createdAt: string;
}

export interface LearningEvent {
  id: string;
  profileId: string;
  eventType: string;
  storybookId: string | null;
  gameType: string | null;
  word: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface LearningEventInsert {
  profile_id: string;
  event_type: string;
  storybook_id?: string | null;
  game_type?: string | null;
  word?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}
```

### 3.6 클라이언트 상태 (React Context + localStorage)

- Supabase session — `supabase.auth.getSession()` + `onAuthStateChange` → `useSession()`
- Active child profile id — `localStorage['tangobook:activeProfileId']`
- ParentGate memoize — `sessionStorage['tangobook:parentGateUntil']` (ISO 타임스탬프, 15분 유효)
- Migration flag — `localStorage['tangobook:migrated:v1']` (일회성, set 후 재실행 방지)

## 4. 컴포넌트 상세

### 4.1 `LoginPage` (`/login`)

탭 스위처 (`SignInForm` ↔ `SignUpForm`) + 좌측 hero (호리 `reading` WebP 재사용).

**플로우 state machine**:
```
LoginPage step:
  'auth'    → SignInForm 또는 SignUpForm
  'setPin'  → SetPinStep (가입 후 PIN 미설정 시)
  'profile' → ProfileCreateStep (가입 후 자녀 프로필 0개)
  'done'    → /library navigate
```

**SignUpForm**:
- email / password / password 확인
- `회원가입` 버튼 → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl } })`
- `Google로 계속` 버튼 → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl } })`
- 성공 (이메일 확인 필요): "확인 이메일을 보냈어요. 링크를 눌러주세요" toast. 실제 step 전환은 확인 후 첫 로그인 시.
- OAuth 복귀 시 step은 `setPin`/`profile` 결정돼야 함 → `/login/callback`에서 session 수립 후 `LoginPage`로 리다이렉트, useCurrentAccount로 `hasPin`·`profiles.length` 확인.

**SignInForm**:
- email / password → `signInWithPassword`
- Google 버튼 (동일)
- 로그인 성공 → `hasPin=false`면 setPin, `profiles.length=0`이면 profile, 아니면 done

**SetPinStep**:
- 호리 marketing 문구
- `PinPad` 2회 (설정 + 재확인 매칭 검증)
- 성공 → `supabase.rpc('set_pin', { raw_pin })` → account refetch → 다음 step

**ProfileCreateStep**:
- "첫 아이 프로필을 만들어요"
- `AvatarPicker` + 이름 + 생년월일
- `완료` → `profiles.insert` → `setActiveProfile(newOne)` → done

### 4.2 `ProfilePicker`

자녀 프로필 선택 full-screen 오버레이. 로그인 + activeProfile 없을 때 자동 표시.

- 제목: "누가 놀고 있어요?" (`text-3xl font-black`)
- 그리드: profiles × 카드 + `+ 새 아이 추가` (N<4일 때만)
- 카드: `AvatarRender` + 이름 + 나이 (`w-32 h-32` 아바타)
- 탭 → `setActiveProfile(p)` + `last_active_at` 업데이트 + dismiss
- 우상단 `ParentCornerButton` (🔒)

### 4.3 `ProfileCreateModal` / 편집 재활용

공용 폼 모달. 필드: `AvatarPicker` + 이름 + 생년월일.

- Create 모드: 현재 `profiles.length === 4`이면 외부에서 `+` 버튼 숨김. 모달 직접 open 안 됨.
- Edit 모드: 기존 값 prefill, 추가 `삭제` 버튼 (confirm `{name} 프로필을 삭제할까요? 학습 기록도 사라져요.` → cascade delete)
- 이름 길이 검증 `.trim().length in [1,10]`. 아바타·이름 필수.

### 4.4 `AvatarPicker` / `AvatarRender`

**에셋 전략**:
- `hori`: 기존 `public/mascot/hori/pointing.webp` 재사용
- 나머지 7종 (`dino/rabbit/bear/cat/dog/penguin/fox`): **이모지 fallback** 1차 릴리스 (🦖🐰🐻🐱🐶🐧🦊). `public/mascot/avatars/{id}.webp` 가 있으면 자동 우선 사용. Phase 2에서 WebP 교체 시 코드 변경 없음.
- `AvatarRender({ id, size })` 컴포넌트가 존재 확인 → 있으면 WebP, 없으면 이모지.

**AvatarPicker UI**:
- 4열 × 2행 그리드
- 각 아바타 큰 터치 타겟 (`w-20 h-20 sm:w-24 sm:h-24`)
- 선택된 것 `ring-4 ring-coral-500`
- `onChange(avatarId)`

### 4.5 `ParentCornerButton` (🔒 우상단)

- `LibraryPage` 우상단 고정
- 상태별:
  - 게스트 (Supabase configured + 미로그인): "🔒 부모" → `/login`
  - 로그인 + 프로필 없음: 사용 안 함 (LoginPage로 이미 리다이렉트됐을 것)
  - 로그인 + activeProfile 있음: "👤 부모님 영역" → `ParentGateModal` 열기 → 통과 시 `/parent`
- Supabase 미설정 시 완전히 숨김 (graceful degradation)

### 4.6 `ParentGateModal` + `PinPad`

`ParentGateModal`:
- 전체 어둡게 (`fixed inset-0 bg-black/70 backdrop-blur-sm`)
- 중앙 카드: 호리 `thinking` + "부모님만 들어올 수 있어요"
- `PinPad` (4칸 + 숫자 키패드 `grid grid-cols-3 gap-3`)
- 3회 오답 → 60초 lockout, 키패드 disable + 카운트다운
- 1회 통과 → sessionStorage 타임스탬프 저장 → children 렌더 + modal close

`PinPad`:
- 4개 원형 indicator (채워진 자리는 coral-500 점)
- 숫자 0~9 + `⌫` 버튼. 각 `h-14` 이상 큰 터치 타겟
- 4자리 채워지면 자동 `onComplete(pin)` 호출
- `error` prop true → shake 애니 + 자동 clear

### 4.7 `/parent` — ParentHomePage (shell)

```
┌──────────────────────────────┐
│  🏠 부모님 영역       [🚪]   │
├──────────────────────────────┤
│ [📊 학습 리포트][👦 자녀][⚙️]  │
├──────────────────────────────┤
│ (선택된 탭)                  │
└──────────────────────────────┘
```

- `📊 학습 리포트`: placeholder `곧 공개 🚧` + 호리 sleeping (이번 스펙 범위 밖)
- `👦 자녀 관리`: `ProfileCreateModal`/`ProfileEditModal`·삭제 CRUD 실제 동작
- `⚙️ 설정`: PIN 변경·로그아웃·계정 삭제(`supabase.auth.admin.deleteUser` 대신 사용자용 `supabase.rpc('delete_self_account')` RPC 추가)

### 4.8 LibraryPage 변경

- 우상단에 `ParentCornerButton` 렌더
- 로그인 + activeProfile 있으면 상단 좌측에 `👋 {name}` 배지 (탭 → `ProfilePicker` 재오픈)
- 기존 검색·탭·카테고리 필터는 변경 없음
- `LibraryPage` isPublic 필터는 그대로

### 4.9 Context & Providers

```tsx
// features/auth/context/AuthContext.tsx
interface AuthContextValue {
  isConfigured: boolean;             // Supabase env var 설정 여부
  session: Session | null;
  account: Account | null;
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  setActiveProfile: (p: ChildProfile | null) => void;
  refresh: () => Promise<void>;      // account + profiles 재조회
  signOut: () => Promise<void>;
}
```

- `AuthProvider`가 앱 최상단 (`main.tsx`)에서 감쌈
- Supabase `onAuthStateChange` 구독 → `session` 상태
- session 변경 시 `account`, `profiles` 자동 refetch (TanStack Query)
- `SIGNED_IN` 이벤트 시 `runMigrations` 호출 (후술)
- `SIGNED_OUT` 시 localStorage active profile 클리어

### 4.10 라우트 가드

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/login/callback" element={<LoginCallback />} />
  <Route path="/parent/*" element={
    <RequireAuthedWithPin>
      <ParentHomePage />
    </RequireAuthedWithPin>
  } />
  {/* 나머지 기존 라우트들 */}
</Routes>
```

**`RequireAuthedWithPin`**:
1. `!isConfigured` → `/library`로 redirect (Supabase 미설정 시 부모 영역 접근 불가)
2. `!session` → `/login` redirect
3. `!account?.hasPin` → `SetPinStep` 인라인 렌더 (같은 라우트 내)
4. `useParentGate().isUnlocked !== true` → `ParentGateModal` 인라인 렌더
5. 전부 통과 → `children` 렌더

**`RequireAuthed` (PIN 없음)**: `/login/callback`에서만 사용. 일반적으론 `RequireAuthedWithPin` 씀.

## 5. 인증 흐름

### 5.1 회원가입 (email)

1. `/login` → "회원가입" 탭 → email/pw 입력 → `supabase.auth.signUp`
2. Supabase가 확인 이메일 발송 (기본 활성)
3. "확인 메일을 보냈어요" toast. 사용자는 이메일에서 링크 클릭
4. 링크가 `/login/callback?code=...`으로 redirect → `exchangeCodeForSession` → session 수립
5. LoginPage state → `setPin` (hasPin=false니까)
6. 4자리 PIN 설정 → `rpc('set_pin')`
7. state → `profile` (profiles=0)
8. AvatarPicker + 이름 + 생일 → `profiles.insert` + `setActiveProfile`
9. `/library`

### 5.2 로그인 (email)

1. email/pw → `signInWithPassword`
2. `hasPin=false`면 SetPinStep 강제
3. `profiles=0`이면 ProfileCreateStep 강제
4. `profiles≥1`이면 LibraryPage로 이동 → `ProfilePicker` 자동 표시 (activeProfile 없으니)
5. 프로필 선택 후 Library 사용

### 5.3 Google OAuth

1. "Google로 계속" → `signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/login/callback` } })`
2. Google 페이지 → 동의 → `/login/callback?code=...`
3. `LoginCallback` 컴포넌트가 `exchangeCodeForSession` (또는 SDK 자동 처리)
4. 신규 사용자면 SetPin → Profile, 기존이면 프로필 picker로 진행

> **이메일 확인과의 관계**: OAuth(Google)는 Google이 이미 이메일을 검증했으므로 Supabase가 `email_confirmed_at`을 자동 설정 → 이메일 확인 단계 없이 즉시 verified 세션. `set_pin` RPC도 호출 즉시 `auth.uid()` 반환 → 정상 동작. Email/PW 가입만 확인 메일 링크 클릭 후 첫 로그인 시 SetPin 진입.

### 5.4 게스트 → 로그인 전환

1. 게스트 상태에서 `ParentCornerButton` 탭 → `/login`
2. 로그인 성공 직후 (AuthContext `SIGNED_IN` 리스너):
   - `runMigrations(activeProfile.id)` 호출 — localStorage 진척 → `learning_events` bulk insert
   - `localStorage['tangobook:migrated:v1']` 플래그 set → 재실행 방지
3. 이후 뷰어 기능은 동일

### 5.5 PIN 흐름

**설정** (가입 · 설정 화면 "PIN 변경"):
- `rpc('set_pin', { raw_pin })` 호출. 성공 시 account refetch로 `hasPin=true`.

**검증** (parent gate 진입):
- `ParentGateModal` → PinPad → `rpc('verify_pin', { raw_pin })`
- `true` → `sessionStorage['tangobook:parentGateUntil'] = Date.now() + 15*60*1000` → children 렌더
- `false` → PinPad error prop → 흔들림 + 카운터 +1
- 3회 실패 → 60초 lockout (클라 memo, 타이머 만료 시 해제)

**리셋**:
- 로그인 화면 "PIN 잊었어요" 링크 → 이메일 입력
- Supabase Edge Function `reset-pin`이 magic link 발송
- 링크 클릭 → 임시 세션 → 새 PIN 설정 화면 → `rpc('set_pin')`

**Edge Function 구현 — `supabase/functions/reset-pin/index.ts`**:

```ts
// Deno + Supabase Edge Runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 간단한 IP 기반 rate limit (메모리, 인스턴스 재시작 시 초기화 허용)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_PER_WINDOW) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    entry.count += 1;
  } else {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  let email: string;
  try {
    const body = await req.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!email) {
    // 항상 200 응답 (email enumeration 방지)
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // magic link 생성 — 복귀 URL에 ?pinReset=1 플래그 붙여 클라가 PIN 설정 화면으로 분기
  const redirectTo = `${Deno.env.get('PUBLIC_APP_URL') ?? ''}/login/callback?pinReset=1`;
  await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });
  // 실패해도 동일 응답 (enumeration 방지). 실패 로그는 Supabase Function logs에 남음.

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**필요한 env**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Edge Function 런타임만 보유), `PUBLIC_APP_URL` (https://tangobook.railway.app 같은 프로덕션 URL).

**클라이언트 호출**: `await fetch(\`${SUPABASE_URL}/functions/v1/reset-pin\`, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })`.

**로그인 콜백 분기** — `/login/callback`이 `?pinReset=1`를 받으면 `SetPinStep` 강제 진입 (기존 `hasPin=true`여도).

**배포**: `supabase functions deploy reset-pin --no-verify-jwt` (공개 POST 엔드포인트이므로 JWT 검증 스킵).

### 5.6 로그아웃

`signOut()` → session null → AuthContext가 localStorage activeProfile 삭제 → `/library` redirect. 게스트 모드 복귀.

## 6. 마이그레이션 (localStorage → Supabase)

### 6.1 플러그인 레지스트리 (`features/auth/lib/migrations.ts`)

```ts
interface LocalMigration {
  id: string;
  /**
   * 제약: 반드시 `g` 플래그 없이 작성. `.test()` side effect(`lastIndex`)
   * 때문에 `/g` 정규식은 매 두 번째 호출마다 false 반환하는 버그 유발.
   */
  keyPattern: RegExp;
  toEvents: (
    key: string,
    value: unknown,
    profileId: string
  ) => LearningEventInsert[];
}

const MIGRATIONS: LocalMigration[] = [
  {
    id: 'speaking-progress',
    keyPattern: /^tangobook:speaking:([^:]+):(ko|en)$/,
    toEvents: (key, value, profileId) => {
      const m = key.match(/^tangobook:speaking:([^:]+):(ko|en)$/);
      const entry = value as { wordsSpoken?: string[]; lastPlayedAt?: string };
      if (!m || !entry?.wordsSpoken || entry.wordsSpoken.length === 0) return [];
      return entry.wordsSpoken.map((word) => ({
        profile_id: profileId,
        event_type: 'word_spoken',
        storybook_id: m[1],
        word,
        metadata: { lang: m[2], migratedFrom: 'localStorage:v0' },
        created_at: entry.lastPlayedAt ?? new Date().toISOString(),
      }));
    },
  },
  // 이후 스펙에서 여기에 추가
];

export async function runMigrations(profileId: string): Promise<void> {
  if (localStorage.getItem('tangobook:migrated:v1')) return;
  const allEvents: LearningEventInsert[] = [];
  const keysToRemove: string[] = [];
  for (const m of MIGRATIONS) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !m.keyPattern.test(key)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const value = JSON.parse(raw);
        allEvents.push(...m.toEvents(key, value, profileId));
        keysToRemove.push(key);
      } catch {
        // 파싱 실패 — 스킵
      }
    }
  }
  if (allEvents.length > 0) {
    const { error } = await supabase.from('learning_events').insert(allEvents);
    if (error) {
      console.warn('[migration] insert failed, keeping localStorage:', error);
      return;
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem('tangobook:migrated:v1', new Date().toISOString());
}
```

### 6.2 실행 지점

`AuthContext`의 `onAuthStateChange` 이벤트 `SIGNED_IN` 리스너에서:
- activeProfile 선택 직후 (profile 선택 이벤트)
- `tangobook:migrated:v1` 플래그 체크
- 비동기 백그라운드 실행 (UI 블로킹 없음)

### 6.3 멱등성·경계

- **한 계정 여러 기기**: 마이그 플래그는 기기별(localStorage는 기기 localStorage) → 기기마다 독립 마이그레이션. B 기기에 같은 localStorage 데이터 있으면 중복 insert. 통계 영향 미미 수용.
- **파싱 실패 엔트리**: console.debug 후 스킵. 다른 엔트리 진행.
- **insert 실패**: localStorage 유지 + 플래그 set 안 함. 다음 로그인 재시도.
- **미완 마이그레이션 중 로그아웃**: 플래그 안 설정되니 재로그인 시 재시도.
- **후속 스펙의 dedup**: 이 플래그는 **기기별**. 여러 기기에서 같은 데이터를 각자 마이그레이션하면 중복 이벤트 발생. 다음 마스터리 예측 스펙은 **`(profile_id, storybook_id, word, metadata->>lang)` 기준 sliding window dedup**을 반드시 적용해야 함 (`migratedFrom` 플래그에 의존 금지).

## 7. 에러 · 경계

| # | 상황 | 감지 지점 | 사용자 UI | 내부 |
|---|---|---|---|---|
| 1 | 이메일 중복 | `signUp` 422 | "이미 가입된 이메일이에요. 로그인해주세요" toast + 로그인 탭 전환 | - |
| 2 | 이메일 미확인 상태 로그인 | `signInWithPassword` 400 | "이메일 확인이 필요해요. 재전송할까요?" + 재전송 버튼 | `supabase.auth.resend({ type: 'signup' })` |
| 3 | 비밀번호 틀림 | `signInWithPassword` 400 | "이메일 또는 비밀번호가 틀렸어요" (모호) | 3회 오답 10초 cooldown |
| 4 | OAuth callback 에러 | `/login/callback?error=...` | "Google 로그인이 취소됐어요" toast → /login | - |
| 5 | PIN 3회 오답 | `verify_pin` false count | "잠깐만 쉬었다 다시 해주세요 (60초)" + 키패드 disable | 타이머 만료 후 해제 |
| 6 | 프로필 4개 한도 | 클라 선제 체크 | `+ 새 아이 추가` 버튼 숨김 | - |
| 7 | 프로필 0명 + `/library` 접근 | AuthContext 가드 | ProfileCreateStep 모달 강제 (close 불가) | - |
| 8 | PIN 미설정 + `/parent` 접근 | `RequireAuthedWithPin` | `SetPinStep` 인라인 렌더 | - |
| 9 | 세션 만료 | `onAuthStateChange` `TOKEN_REFRESHED` fail | "다시 로그인해주세요" + `/login` | `clearActiveProfile` |
| 10 | Supabase unreachable | 모든 쿼리 네트워크 에러 | "연결 문제로 일부 기능이 제한돼요" 배너 | TanStack Query 재시도 (지수 백오프). 뷰어 게스트 기능 계속 작동 |
| 11 | RLS 거부 (변경 불가) | Supabase `PGRST116` | 조용히 무시 (데이터 없는 것처럼) | - |
| 12 | 마이그레이션 insert 실패 | `learning_events.insert` error | 사용자 영향 없음 (백그라운드) | localStorage 유지, 다음 로그인 재시도 |
| 13 | PIN RPC 실패 | `rpc('set_pin')` error | "잠시 후 다시 시도해주세요" toast | 가입 플로우 진행 불가 (재시도 유도) |
| 14 | 프로필 이름 빈 문자열·11자 | 클라 폼 검증 | 인라인 에러 | - |
| 15 | 여러 탭 로그아웃 | `SIGNED_OUT` 이벤트 | 자동 게스트 복귀 + `/library` | activeProfile 클리어 |
| 16 | Supabase env var 미설정 | `supabase.isConfigured === false` | `ParentCornerButton` 숨김 + `/login` 404 느낌 대신 `/library` redirect | console.warn 1회 |

## 8. 보안

- **PIN 저장**: DB에만 bcrypt hash. 클라 메모리엔 평문 PIN이 input·RPC 호출 순간만.
- **PIN RPC**: `SECURITY DEFINER` + `auth.uid()` 내부 참조. 타 계정 조작 불가.
- **브루트포스 PIN**: 클라 3회 lockout + Supabase Auth Rate Limiting (RPC도 제한 대상). 10000 조합 공격 현실적 위협 낮음 (세션 필요 + RLS).
- **Email enumeration**: 가입·로그인 에러 메시지 일반화. resetPassword/resetPin은 항상 "요청 접수" 응답.
- **Service Role Key**: 이번 스펙에서 사용 **금지**. 클라는 anon key만. 서버 집계는 다음 스펙에서 필요 시 Edge Function으로.
- **`authenticated` 역할만 execute**: RPC 함수들에 `grant execute to authenticated`. anon 사용자는 호출 불가.
- **CSRF**: Supabase SDK는 httpOnly cookie가 아닌 localStorage 기반이라 CSRF 위험 낮음. OAuth redirect URI는 Supabase 설정에서 whitelist (`http://localhost:5174/login/callback`, `https://tangobook.example.com/login/callback`).

## 9. 테스트 전략

### 9.1 TDD 대상 (순수 로직)

- `migrations.test.ts` (~7 tests): `runMigrations` 멱등성·파싱 실패·insert 실패·플래그 관리
- `useParentGate.test.ts` (~5 tests): 15분 memoize·3회 lockout·timer 만료
- `useSession.test.tsx` (~4 tests): Supabase event 구독·SIGNED_IN/OUT 파급

### 9.2 컴포넌트 테스트

- `PinPad.test.tsx` (~3): 입력·오답 애니·complete 콜백
- `ProfilePicker.test.tsx` (~3): 프로필 렌더·탭 선택·4명 한도에서 + 숨김
- `ProfileCreateModal.test.tsx` (~3): 빈 이름 disabled·maxLength·성공 콜백
- `RequireAuthedWithPin.test.tsx` (~5): unauthed·미설정 Supabase·PIN 미설정·미통과·통과

### 9.3 모킹

- `@supabase/supabase-js` `createClient` `vi.mock` — `auth.{getSession,onAuthStateChange,signInWith*,signUp,signOut}` + `from().insert/select/update/delete` + `rpc`
- `localStorage`·`sessionStorage` — jsdom 기본 + 각 테스트 beforeEach clear

### 9.4 수동 QA (릴리스 전, 사용자 담당)

- Email 가입 → 확인 메일 → 로그인 → PIN → 프로필 → Library
- Google OAuth 가입 → 동일 플로우
- 로그인 + 게스트 진척 이관 → Supabase 테이블 확인 + localStorage 정리
- PIN 분실 → 이메일 리셋 → 새 PIN
- 프로필 4명 한도 → + 버튼 숨김
- 다중 기기 sync → A에서 프로필 삭제 → B에서 refresh 시 사라짐
- RLS 침투 시도 → 다른 계정 profile id 요청 → 거부
- Supabase 미설정 배포 → `ParentCornerButton` 숨김 + 뷰어 정상
- 뷰어 게스트 기능 회귀 없음

### 9.5 신규 테스트 수

기존 client 60 → 약 30 추가 → 대략 **90 total**.

## 10. Supabase 프로젝트 셋업 (사용자 수동 1회성)

이 스펙 구현 완료 후, 릴리스 전 **사용자가 한 번 수행**:

1. supabase.com 프로젝트 생성 (Seoul 리전 권장)
2. SQL editor에 `scripts/supabase-setup.sql` 붙여넣고 실행 — 테이블·RLS·RPC·트리거 전부
3. Auth > Providers:
   - Email: 활성화, 확인 메일 켜둠
   - Google: Google Cloud Console에서 OAuth credentials 발급 → Supabase에 Client ID/Secret 입력 → "Authorized redirect URIs"에 `https://{your-project}.supabase.co/auth/v1/callback` 추가
4. Auth > URL Configuration:
   - Site URL: `https://tangobook.railway.app` (실제 프로덕션 URL)
   - Redirect URLs: `http://localhost:5174/login/callback`, `https://tangobook.railway.app/login/callback`
5. Auth > Email Templates (선택): 한국어 confirm 메일 문구 커스터마이징
6. Edge Functions: `supabase functions deploy reset-pin` (스펙 구현 결과물 배포)
7. Settings > API: URL, anon key 복사 → 환경변수 설정:
   - 로컬: `packages/client/.env.local` (git ignored) 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Railway: Variables 섹션에 동일 두 env var 추가 → 재배포

**env 설정 전에도 배포 가능**: `isConfigured=false` 경로로 로그인 기능 비활성, 뷰어 게스트 모드는 정상 동작.

## 11. 성능 · 확장

- **번들 사이즈**: `@supabase/supabase-js` gzip ~30KB, tree-shaking 후 auth+from+rpc ~50KB. 허용 범위.
- **초기 로드**: session 체크 async. 게스트는 즉시 렌더, 로그인 UI는 세션 복원 완료 후 나타남. 스켈레톤 대신 투명 placeholder로 깜빡임 방지.
- **RLS 성능**: `child_profiles.account_id`, `learning_events.profile_id` 인덱스로 기본 조회 빠름. `learning_events` 스케일링(수만 사용자 × 일일 수백 이벤트)은 다음 스펙에서 파티션·materialized view 검토.
- **Supabase 무료 tier**: 50k MAU · 8GB DB. Pro $25/mo (확장 필요 시). 초기 성장에 충분.

## 12. 이후 스펙과의 연결

- **학습 이벤트 수집 스펙** (다음): 뷰어·게임 곳곳에 `supabase.from('learning_events').insert(...)` 끼워넣기. 이 스펙의 `LearningEventInsert` 타입·`activeProfile` context 재사용.
- **마스터리 예측 스펙**: SQL aggregate + materialized view 기반. 이 스펙 `learning_events` 스키마 그대로.
- **리포팅 UI 스펙**: `/parent` 하위에 `ReportsTab` 추가. 지금 placeholder 자리.
- **뱃지·포인트 스펙**: 신규 테이블 `badges`, `points_ledger` 추가. `accounts`·`child_profiles` FK 재사용.

## 13. 리스크 · 미확정 사항

- **Supabase 의존**: 이후 스펙들까지 Supabase 깊이 결합. Vendor lock-in. 오픈소스라 self-host 가능(Postgres + GoTrue) — 위험 관리 가능.
- **아바타 7종 이모지 fallback**: 시각 품질 편차 존재. Phase 2에 WebP 제작 필요.
- **`reset-pin` Edge Function**: Supabase Edge Functions Deno 런타임 경험 필요. 구현 난이도 중.
- **이메일 확인 UX**: Supabase 기본 이메일 전달이 느리거나 스팸 분류될 수 있음. Site URL·발신자 검증 필요.
- **Apple OAuth 미포함**: iOS 앱 배포 시점에 추가 필요 (Supabase 설정 한 줄이라 쉬움).
- **Kakao OAuth 미포함**: 한국 시장 확장 시 고려. Supabase는 Kakao 네이티브 지원 없어 커스텀 OAuth flow 필요.
