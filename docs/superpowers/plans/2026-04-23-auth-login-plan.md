# 로그인/계정 시스템 Implementation Plan

> **✅ 구현 완료 (2026-04-23)** — 스펙: `docs/superpowers/specs/2026-04-23-auth-login-design.md`. 진행 상세: `memory/auth-login-complete.md`.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부모 계정 + 자녀 프로필 + PIN 보호 + localStorage 마이그레이션까지 Supabase 기반으로 구축. 게스트 모드 그대로 유지하며 로그인 시 학습 리포팅의 기반을 확보.

**Architecture:** 클라이언트가 `@supabase/supabase-js`로 Auth + Postgres를 직접 호출 (RLS로 보호). 서버는 이번 스펙에서 변경 없음. PIN은 pgcrypto 기반 RPC. 환경변수 미설정 시 graceful degradation (게스트만).

**Tech Stack:** React 18 + TypeScript + Vite + TanStack Query (이미 사용) + Supabase (신규) + `@supabase/supabase-js`. 테스트는 vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-23-auth-login-design.md`

---

## File Structure

### 신규 파일

```
packages/shared/src/types/
  auth.ts                                          # AvatarId, Account, ChildProfile, LearningEvent

packages/client/src/
  lib/
    supabase.ts                                    # createClient 싱글톤 + isConfigured
  features/auth/
    api/auth.api.ts                                # signUp/signIn/OAuth/signOut/resetPassword/setPin/verifyPin/deleteAccount
    api/profiles.api.ts                            # listProfiles/createProfile/updateProfile/deleteProfile
    hooks/useSession.ts
    hooks/useCurrentAccount.ts
    hooks/useActiveProfile.ts
    hooks/useParentGate.ts
    hooks/useParentGate.test.ts
    components/LoginPage.tsx
    components/SignInForm.tsx
    components/SignUpForm.tsx
    components/SetPinStep.tsx
    components/ProfileCreateStep.tsx
    components/ProfilePicker.tsx
    components/ProfileCreateModal.tsx
    components/ProfileCreateModal.test.tsx
    components/ProfilePicker.test.tsx
    components/ParentGateModal.tsx
    components/PinPad.tsx
    components/PinPad.test.tsx
    components/AvatarPicker.tsx
    components/AvatarRender.tsx
    components/ParentCornerButton.tsx
    guards/RequireAuthed.tsx
    guards/RequireAuthedWithPin.tsx
    guards/RequireAuthedWithPin.test.tsx
    context/AuthContext.tsx
    context/AuthContext.test.tsx                   # runMigrations 통합 + session 상태
    lib/migrations.ts
    lib/migrations.test.ts
    lib/avatars.ts                                  # AVATAR_IDS + fallback emoji
    pages/
      ParentHomePage.tsx
      ParentProfilesPage.tsx
      ParentSettingsPage.tsx
    index.ts

  pages/
    LoginCallback.tsx                               # /login/callback — OAuth·pinReset 복귀 처리

scripts/
  supabase-setup.sql                                # 테이블·RLS·RPC·트리거 (수동 실행)

supabase/
  functions/reset-pin/index.ts                     # Edge Function (Deno)

packages/client/.env.local.example                 # 샘플 env
```

### 수정 파일

```
packages/client/
  package.json                                     # @supabase/supabase-js 의존성 추가
  src/main.tsx                                     # <AuthProvider>로 래핑
  src/router/index.tsx                             # /login, /login/callback, /parent/* 라우트 추가
  src/pages/LibraryPage.tsx                        # ParentCornerButton + activeProfile 배지
  vite.config.ts                                   # (변경 없음 — env는 VITE_ prefix라 자동 exposed)

packages/shared/src/
  index.ts                                         # auth types re-export
```

---

## Chunk 1: Foundation — 타입·Supabase 클라·SQL·env

**목표:** 타입·Supabase 클라이언트 싱글톤·SQL 파일·env 샘플. 아직 UI 없음. 이후 chunk 전체의 기반.

**기간:** 0.5일

### Task 1.1: Shared 타입 추가

**Files:**
- Create: `packages/shared/src/types/auth.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: `auth.ts` 생성**

```ts
export const AVATAR_IDS = [
  'hori', 'dino', 'rabbit', 'bear', 'cat', 'dog', 'penguin', 'fox',
] as const;
export type AvatarId = typeof AVATAR_IDS[number];

export interface Account {
  id: string;
  email: string | null;
  hasPin: boolean;
  pinSetAt: string | null;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  accountId: string;
  name: string;
  avatarId: AvatarId;
  birthDate: string | null;
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

- [ ] **Step 2: `shared/index.ts`에 re-export 추가**

```ts
export * from './types/auth.js';
```

- [ ] **Step 3: `pnpm --filter @tangobook/shared build`**

Expected: `tsc` 무에러.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/auth.ts packages/shared/src/index.ts
git commit -m "feat(shared): auth types (Account, ChildProfile, AvatarId, LearningEvent)"
```

### Task 1.2: Supabase 클라이언트 + env 샘플

**Files:**
- Create: `packages/client/src/lib/supabase.ts`
- Create: `packages/client/.env.local.example`

- [ ] **Step 1: `@supabase/supabase-js` 의존성 추가**

```bash
pnpm --filter @tangobook/client add @supabase/supabase-js
```

- [ ] **Step 2: `supabase.ts` 구현**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : // Dummy client — env 미설정 시 호출하면 명확한 에러를 내도록. 실제 호출은 isSupabaseConfigured 체크로 차단.
    createClient('https://invalid.local', 'invalid', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
```

- [ ] **Step 3: `.env.local.example` 생성**

```
# Supabase (로그인 기능 활성화용)
# supabase.com 프로젝트 Settings > API에서 복사
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 4: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 5: Commit**

```bash
git add packages/client/package.json pnpm-lock.yaml packages/client/src/lib/supabase.ts packages/client/.env.local.example
git commit -m "feat(client): supabase client singleton + env sample (isSupabaseConfigured guard)"
```

### Task 1.3: SQL 셋업 스크립트

**Files:**
- Create: `scripts/supabase-setup.sql`

- [ ] **Step 1: SQL 파일 작성 — 스펙 §3.1~3.6 통합**

```sql
-- tangobook auth/login 테이블·RLS·RPC·트리거 셋업
-- supabase.com 프로젝트 SQL Editor에 전체 붙여넣고 실행 (1회성)

create extension if not exists pgcrypto;

-- 1. accounts
create table if not exists accounts (
  id uuid references auth.users on delete cascade primary key,
  email text,
  pin_hash text,
  pin_set_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. child_profiles
create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  name text not null check (length(trim(name)) between 1 and 10),
  avatar_id text not null,
  birth_date date,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_child_profiles_account on child_profiles(account_id);

-- 3. learning_events (shell)
create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references child_profiles(id) on delete cascade not null,
  event_type text not null,
  storybook_id text,
  game_type text,
  word text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_learning_events_profile on learning_events(profile_id, created_at desc);
create index if not exists idx_learning_events_word on learning_events(word) where word is not null;

-- RLS
alter table accounts enable row level security;
alter table child_profiles enable row level security;
alter table learning_events enable row level security;

drop policy if exists "account_self_select" on accounts;
create policy "account_self_select" on accounts for select using (auth.uid() = id);

drop policy if exists "account_self_update" on accounts;
create policy "account_self_update" on accounts for update using (auth.uid() = id);

drop policy if exists "account_self_insert" on accounts;
create policy "account_self_insert" on accounts for insert with check (auth.uid() = id);

drop policy if exists "child_self_all" on child_profiles;
create policy "child_self_all" on child_profiles for all using (account_id = auth.uid());

drop policy if exists "event_self_all" on learning_events;
create policy "event_self_all" on learning_events for all using (
  exists (
    select 1 from child_profiles cp
    where cp.id = learning_events.profile_id and cp.account_id = auth.uid()
  )
);

-- 트리거: auth.users → accounts
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into accounts (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 자녀 최대 4명 trigger
create or replace function enforce_child_limit() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from child_profiles where account_id = new.account_id) >= 4 then
    raise exception 'child_profiles max 4 per account';
  end if;
  return new;
end;
$$;

drop trigger if exists child_profiles_limit_trigger on child_profiles;
create trigger child_profiles_limit_trigger
  before insert on child_profiles
  for each row execute function enforce_child_limit();

-- PIN RPC
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

revoke all on function set_pin(text) from public;
revoke all on function verify_pin(text) from public;
grant execute on function set_pin(text) to authenticated;
grant execute on function verify_pin(text) to authenticated;

-- 계정 삭제 RPC
create or replace function delete_self_account() returns void
language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from accounts where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_self_account() from public;
grant execute on function delete_self_account() to authenticated;
```

- [ ] **Step 2: 파일 저장 후 Commit**

```bash
git add scripts/supabase-setup.sql
git commit -m "feat(db): supabase-setup.sql — tables + RLS + RPC + triggers for auth"
```

### Task 1.4: Reset-PIN Edge Function

**Files:**
- Create: `supabase/functions/reset-pin/index.ts`

- [ ] **Step 1: Deno Edge Function 작성 (스펙 §5.5 코드 그대로)**

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') ?? '';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_PER_WINDOW) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  if (!email) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const redirectTo = `${PUBLIC_APP_URL}/login/callback?pinReset=1`;
  await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/reset-pin/index.ts
git commit -m "feat(supabase): reset-pin Edge Function (Deno, rate-limited, enumeration-safe)"
```

### Task 1.5: Chunk 1 sanity

- [ ] **Step 1: 전체 typecheck + build**

```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```
Expected: 전부 PASS, 기존 60 tests 그대로.

**🏁 Chunk 1 완료 기준:**
- [ ] shared 타입 추가됨 + export
- [ ] Supabase 클라 싱글톤 + isSupabaseConfigured 가드
- [ ] SQL 스크립트 작성
- [ ] Edge Function 작성
- [ ] env 샘플 파일
- [ ] 기존 test 회귀 없음

---

## Chunk 2: API + 훅 (TDD)

**목표:** Supabase 호출 래퍼 + context·훅 3종 + PIN gate 훅 구현. TDD 대상은 순수 로직만 (migrations·parentGate).

**기간:** 1~1.5일

### Task 2.1: `auth.api.ts` · `profiles.api.ts`

**Files:**
- Create: `packages/client/src/features/auth/api/auth.api.ts`
- Create: `packages/client/src/features/auth/api/profiles.api.ts`

- [ ] **Step 1: `auth.api.ts` 작성**

```ts
import { supabase } from '@/lib/supabase';

export const authApi = {
  async signUp(email: string, password: string) {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  async setPin(rawPin: string) {
    const { error } = await supabase.rpc('set_pin', { raw_pin: rawPin });
    if (error) throw error;
  },

  async verifyPin(rawPin: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_pin', { raw_pin: rawPin });
    if (error) throw error;
    return data === true;
  },

  async deleteAccount() {
    const { error } = await supabase.rpc('delete_self_account');
    if (error) throw error;
    await supabase.auth.signOut();
  },

  async requestPinReset(email: string) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-pin`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ email }),
    });
    // 항상 성공 취급 (enumeration 방지)
  },
};
```

- [ ] **Step 2: `profiles.api.ts` 작성**

```ts
import { supabase } from '@/lib/supabase';
import type { ChildProfile, AvatarId } from '@tangobook/shared';

interface ProfileRow {
  id: string;
  account_id: string;
  name: string;
  avatar_id: string;
  birth_date: string | null;
  last_active_at: string | null;
  created_at: string;
}

function rowToProfile(r: ProfileRow): ChildProfile {
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    avatarId: r.avatar_id as AvatarId,
    birthDate: r.birth_date,
    lastActiveAt: r.last_active_at,
    createdAt: r.created_at,
  };
}

export const profilesApi = {
  async list(accountId: string): Promise<ChildProfile[]> {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToProfile);
  },

  async create(input: {
    accountId: string;
    name: string;
    avatarId: AvatarId;
    birthDate: string | null;
  }): Promise<ChildProfile> {
    const { data, error } = await supabase
      .from('child_profiles')
      .insert({
        account_id: input.accountId,
        name: input.name.trim(),
        avatar_id: input.avatarId,
        birth_date: input.birthDate,
      })
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  async update(id: string, patch: Partial<Pick<ChildProfile, 'name' | 'avatarId' | 'birthDate'>>) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.avatarId !== undefined) row.avatar_id = patch.avatarId;
    if (patch.birthDate !== undefined) row.birth_date = patch.birthDate;
    const { data, error } = await supabase
      .from('child_profiles')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  async delete(id: string) {
    const { error } = await supabase.from('child_profiles').delete().eq('id', id);
    if (error) throw error;
  },

  async touchActive(id: string) {
    await supabase
      .from('child_profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', id);
  },
};
```

- [ ] **Step 3: typecheck + Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/api/
git commit -m "feat(auth): auth.api + profiles.api supabase wrappers"
```

### Task 2.2: `migrations.ts` (TDD)

**Files:**
- Create: `packages/client/src/features/auth/lib/migrations.ts`
- Create: `packages/client/src/features/auth/lib/migrations.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (7 tests)**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigrations } from './migrations';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));

import { supabase } from '@/lib/supabase';

describe('runMigrations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('migrated flag 있으면 즉시 return, insert 호출 없음', async () => {
    localStorage.setItem('tangobook:migrated:v1', new Date().toISOString());
    await runMigrations('p1');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('매칭되는 키 없으면 insert 호출 안 함 + flag만 set', async () => {
    localStorage.setItem('unrelated:key', '{}');
    await runMigrations('p1');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('speaking-progress 매칭 + wordsSpoken → word_spoken 이벤트', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과', '바나나'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');

    expect(supabase.from).toHaveBeenCalledWith('learning_events');
    const args = insertMock.mock.calls[0][0];
    expect(args).toHaveLength(2);
    expect(args[0]).toMatchObject({
      profile_id: 'p1',
      event_type: 'word_spoken',
      storybook_id: 'book1',
      word: '사과',
    });
    expect(args[0].metadata).toMatchObject({ lang: 'ko' });
  });

  it('빈 wordsSpoken → 해당 엔트리 이벤트 0개 (스킵)', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: [], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(insertMock).not.toHaveBeenCalled();
    // 매칭 키는 있지만 이벤트가 0개 — 여전히 해당 키는 제거 + flag set
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('파싱 실패 엔트리는 스킵하고 다른 엔트리 진행', async () => {
    localStorage.setItem('tangobook:speaking:book1:ko', 'not-json');
    localStorage.setItem(
      'tangobook:speaking:book2:en',
      JSON.stringify({ wordsSpoken: ['apple'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    const args = insertMock.mock.calls[0][0];
    expect(args).toHaveLength(1);
    expect(args[0].storybook_id).toBe('book2');
  });

  it('insert 성공 시 해당 키 삭제 + 플래그 set', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('insert 실패 시 localStorage 유지 + 플래그 set 안 함', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'network' } });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).not.toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).toBeNull();
  });
});
```

- [ ] **Step 2: FAIL 확인**

```bash
pnpm --filter @tangobook/client test -- migrations.test.ts
```
Expected: 모든 테스트 FAIL (모듈 없음).

- [ ] **Step 3: `migrations.ts` 구현**

```ts
import { supabase } from '@/lib/supabase';
import type { LearningEventInsert } from '@tangobook/shared';

interface LocalMigration {
  id: string;
  /** `g` 플래그 금지 — test() side effect로 매 두 번째 호출마다 false 반환 버그 유발 */
  keyPattern: RegExp;
  toEvents: (key: string, value: unknown, profileId: string) => LearningEventInsert[];
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
];

const FLAG_KEY = 'tangobook:migrated:v1';

export async function runMigrations(profileId: string): Promise<void> {
  if (localStorage.getItem(FLAG_KEY)) return;

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
  localStorage.setItem(FLAG_KEY, new Date().toISOString());
}
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
pnpm --filter @tangobook/client test -- migrations.test.ts
```
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/auth/lib/migrations.ts packages/client/src/features/auth/lib/migrations.test.ts
git commit -m "feat(auth): migrations plugin registry (localStorage speaking → learning_events)"
```

### Task 2.3: `useParentGate` (TDD)

**Files:**
- Create: `packages/client/src/features/auth/hooks/useParentGate.ts`
- Create: `packages/client/src/features/auth/hooks/useParentGate.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (5 tests)**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParentGate } from './useParentGate';

describe('useParentGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-04-23T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 상태: isUnlocked false, isLockedOut false', () => {
    const { result } = renderHook(() => useParentGate());
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.isLockedOut).toBe(false);
  });

  it('unlock 호출 시 sessionStorage 타임스탬프 저장 + isUnlocked true', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    expect(result.current.isUnlocked).toBe(true);
    const raw = sessionStorage.getItem('tangobook:parentGateUntil');
    expect(Number(raw)).toBeGreaterThan(Date.now());
  });

  it('15분 + 1초 경과 후 isUnlocked false', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    });
    expect(result.current.isUnlocked).toBe(false);
  });

  it('registerFailure 3회 호출 시 isLockedOut true, 60초 후 해제', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => {
      result.current.registerFailure();
      result.current.registerFailure();
      result.current.registerFailure();
    });
    expect(result.current.isLockedOut).toBe(true);
    act(() => {
      vi.advanceTimersByTime(60 * 1000 + 100);
    });
    expect(result.current.isLockedOut).toBe(false);
  });

  it('lock() 호출 시 sessionStorage 삭제 + isUnlocked false', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    expect(result.current.isUnlocked).toBe(true);
    act(() => result.current.lock());
    expect(result.current.isUnlocked).toBe(false);
    expect(sessionStorage.getItem('tangobook:parentGateUntil')).toBeNull();
  });
});
```

- [ ] **Step 2: FAIL 확인**

```bash
pnpm --filter @tangobook/client test -- useParentGate.test.ts
```

- [ ] **Step 3: `useParentGate.ts` 구현**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'tangobook:parentGateUntil';
const VALID_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 60 * 1000;
const MAX_FAILURES = 3;

function readUntil(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function useParentGate() {
  const [untilTs, setUntilTs] = useState<number>(() => readUntil());
  const [failureCount, setFailureCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [, forceTick] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // untilTs 또는 lockedUntil 만료 감지용 1초 interval
  useEffect(() => {
    if (untilTs > 0 || lockedUntil > 0) {
      tickerRef.current = setInterval(() => {
        forceTick((t) => t + 1);
      }, 1000);
      return () => {
        if (tickerRef.current) clearInterval(tickerRef.current);
      };
    }
  }, [untilTs, lockedUntil]);

  const now = Date.now();
  const isUnlocked = untilTs > now;
  const isLockedOut = lockedUntil > now;

  const unlock = useCallback(() => {
    const until = Date.now() + VALID_MS;
    setUntilTs(until);
    try {
      sessionStorage.setItem(SESSION_KEY, String(until));
    } catch {
      // no-op
    }
    setFailureCount(0);
  }, []);

  const lock = useCallback(() => {
    setUntilTs(0);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // no-op
    }
  }, []);

  const registerFailure = useCallback(() => {
    setFailureCount((c) => {
      const next = c + 1;
      if (next >= MAX_FAILURES) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        return 0;
      }
      return next;
    });
  }, []);

  return {
    isUnlocked,
    isLockedOut,
    failureCount,
    unlock,
    lock,
    registerFailure,
  };
}
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
pnpm --filter @tangobook/client test -- useParentGate.test.ts
```
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/auth/hooks/useParentGate.ts packages/client/src/features/auth/hooks/useParentGate.test.ts
git commit -m "feat(auth): useParentGate hook with 15-min memoize and 60s lockout"
```

### Task 2.4: `useSession` + `useCurrentAccount` + `useActiveProfile` + AuthContext

**Files:**
- Create: `packages/client/src/features/auth/hooks/useSession.ts`
- Create: `packages/client/src/features/auth/hooks/useCurrentAccount.ts`
- Create: `packages/client/src/features/auth/hooks/useActiveProfile.ts`
- Create: `packages/client/src/features/auth/context/AuthContext.tsx`

- [ ] **Step 1: `useSession.ts`**

```ts
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
```

- [ ] **Step 2: `useCurrentAccount.ts`**

```ts
import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Account, ChildProfile } from '@tangobook/shared';
import { profilesApi } from '../api/profiles.api';

interface AccountRow {
  id: string;
  email: string | null;
  pin_hash: string | null;
  pin_set_at: string | null;
  created_at: string;
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    email: r.email,
    hasPin: r.pin_hash !== null,
    pinSetAt: r.pin_set_at,
    createdAt: r.created_at,
  };
}

async function fetchAccount(uid: string, email: string | null): Promise<Account> {
  let { data, error } = await supabase
    .from('accounts')
    .select('id, email, pin_hash, pin_set_at, created_at')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    // 트리거 race 보정: 클라 upsert fallback
    const { error: upErr } = await supabase
      .from('accounts')
      .upsert({ id: uid, email }, { onConflict: 'id' });
    if (upErr) throw upErr;
    const retry = await supabase
      .from('accounts')
      .select('id, email, pin_hash, pin_set_at, created_at')
      .eq('id', uid)
      .single();
    if (retry.error) throw retry.error;
    data = retry.data;
  }
  return rowToAccount(data as AccountRow);
}

export function useCurrentAccount(session: Session | null) {
  const [account, setAccount] = useState<Account | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setAccount(null);
      setProfiles([]);
      return;
    }
    setLoading(true);
    try {
      const acc = await fetchAccount(session.user.id, session.user.email ?? null);
      setAccount(acc);
      const list = await profilesApi.list(acc.id);
      setProfiles(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { account, profiles, loading, error, refresh, setProfiles };
}
```

- [ ] **Step 3: `useActiveProfile.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import type { ChildProfile } from '@tangobook/shared';
import { profilesApi } from '../api/profiles.api';

const KEY = 'tangobook:activeProfileId';

export function useActiveProfile(profiles: ChildProfile[]) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });

  // profiles 변경 시 active가 list에 없으면 클리어
  useEffect(() => {
    if (activeId && !profiles.some((p) => p.id === activeId)) {
      setActiveId(null);
      try {
        localStorage.removeItem(KEY);
      } catch {
        // no-op
      }
    }
  }, [profiles, activeId]);

  const setActive = useCallback((p: ChildProfile | null) => {
    if (p) {
      setActiveId(p.id);
      try {
        localStorage.setItem(KEY, p.id);
      } catch {
        // no-op
      }
      void profilesApi.touchActive(p.id).catch(() => {});
    } else {
      setActiveId(null);
      try {
        localStorage.removeItem(KEY);
      } catch {
        // no-op
      }
    }
  }, []);

  const activeProfile = activeId ? profiles.find((p) => p.id === activeId) ?? null : null;

  return { activeProfile, setActiveProfile: setActive };
}
```

- [ ] **Step 4: `AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Account, ChildProfile } from '@tangobook/shared';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useSession } from '../hooks/useSession';
import { useCurrentAccount } from '../hooks/useCurrentAccount';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { runMigrations } from '../lib/migrations';

export interface AuthContextValue {
  isConfigured: boolean;
  loading: boolean;
  session: Session | null;
  account: Account | null;
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  setActiveProfile: (p: ChildProfile | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { account, profiles, loading: accLoading, refresh } = useCurrentAccount(session);
  const { activeProfile, setActiveProfile } = useActiveProfile(profiles);
  const migratedForProfile = useRef<string | null>(null);

  // activeProfile 선택 직후 1회 마이그레이션 실행
  useEffect(() => {
    if (!activeProfile) return;
    if (migratedForProfile.current === activeProfile.id) return;
    migratedForProfile.current = activeProfile.id;
    void runMigrations(activeProfile.id);
  }, [activeProfile]);

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setActiveProfile(null);
  };

  const value: AuthContextValue = {
    isConfigured: isSupabaseConfigured,
    loading: sessionLoading || accLoading,
    session,
    account,
    profiles,
    activeProfile,
    setActiveProfile,
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 5: typecheck + Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/hooks/ packages/client/src/features/auth/context/
git commit -m "feat(auth): session/account/profile hooks + AuthContext with migration trigger"
```

### Task 2.5: Chunk 2 sanity

- [ ] **Step 1: 전체 test**

```bash
pnpm --filter @tangobook/client test
```
Expected: 기존 60 + 신규 12 (7 migrations + 5 parentGate) = **72 tests PASS**.

**🏁 Chunk 2 완료 기준:**
- [ ] `auth.api`, `profiles.api`, `migrations`, `useParentGate`, `useSession`, `useCurrentAccount`, `useActiveProfile`, `AuthContext` 구현
- [ ] migrations·parentGate TDD 12 tests PASS
- [ ] typecheck 무에러

---

## Chunk 3: UI — Auth 컴포넌트·ProfilePicker·PinPad·ParentCornerButton

**목표:** 로그인·가입·PIN·프로필 선택/편집의 모든 시각 컴포넌트. 각 컴포넌트는 뷰어 디자인 시스템 상속 (coral/peach/ink + 큰 터치 타겟).

**기간:** 1.5~2일

### Task 3.1: `avatars.ts` + `AvatarRender` + `AvatarPicker`

**Files:**
- Create: `packages/client/src/features/auth/lib/avatars.ts`
- Create: `packages/client/src/features/auth/components/AvatarRender.tsx`
- Create: `packages/client/src/features/auth/components/AvatarPicker.tsx`

- [ ] **Step 1: `avatars.ts`**

```ts
import { AVATAR_IDS, type AvatarId } from '@tangobook/shared';

export { AVATAR_IDS };
export type { AvatarId };

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  hori: '🐯',
  dino: '🦖',
  rabbit: '🐰',
  bear: '🐻',
  cat: '🐱',
  dog: '🐶',
  penguin: '🐧',
  fox: '🦊',
};

// hori는 기존 WebP 사용, 나머지는 이모지 fallback (Phase 2에 WebP 추가 시 경로 반환 로직만 수정)
export function avatarImageUrl(id: AvatarId): string | null {
  if (id === 'hori') return '/mascot/hori/pointing.webp';
  return null;
}
```

- [ ] **Step 2: `AvatarRender`**

```tsx
import { AVATAR_EMOJI, avatarImageUrl, type AvatarId } from '../lib/avatars';

interface Props {
  id: AvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: 'w-10 h-10 text-3xl',
  md: 'w-16 h-16 text-5xl',
  lg: 'w-24 h-24 text-6xl',
  xl: 'w-32 h-32 text-7xl',
};

export function AvatarRender({ id, size = 'md' }: Props) {
  const url = avatarImageUrl(id);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${SIZE_MAP[size]} object-contain rounded-full bg-peach-100 p-2`}
      />
    );
  }
  return (
    <div
      className={`${SIZE_MAP[size]} flex items-center justify-center rounded-full bg-peach-100`}
    >
      <span className="leading-none">{AVATAR_EMOJI[id]}</span>
    </div>
  );
}
```

- [ ] **Step 3: `AvatarPicker`**

```tsx
import { AVATAR_IDS, type AvatarId } from '../lib/avatars';
import { AvatarRender } from './AvatarRender';
import { cn } from '@/lib/cn';

interface Props {
  value: AvatarId | null;
  onChange: (id: AvatarId) => void;
}

export function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-2xl p-2 transition-all bg-white shadow-soft',
            value === id ? 'ring-4 ring-coral-500 scale-105' : 'hover:scale-105 hover:shadow-pop'
          )}
          aria-label={`아바타 ${id}`}
        >
          <AvatarRender id={id} size="md" />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: typecheck + Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/lib/avatars.ts packages/client/src/features/auth/components/AvatarRender.tsx packages/client/src/features/auth/components/AvatarPicker.tsx
git commit -m "feat(auth): avatar system (8 ids, emoji fallback + hori WebP)"
```

### Task 3.2: `PinPad` (TDD)

**Files:**
- Create: `packages/client/src/features/auth/components/PinPad.tsx`
- Create: `packages/client/src/features/auth/components/PinPad.test.tsx`

- [ ] **Step 1: 실패 테스트 (3 tests)**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinPad } from './PinPad';

describe('PinPad', () => {
  it('숫자 4개 탭 → onComplete(문자열) 1회 호출', () => {
    const onComplete = vi.fn();
    render(<PinPad onComplete={onComplete} />);
    ['1', '2', '3', '4'].forEach((n) => {
      fireEvent.click(screen.getByRole('button', { name: n }));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('⌫ 버튼 → 마지막 입력 제거 (onComplete 호출 없음)', () => {
    const onComplete = vi.fn();
    render(<PinPad onComplete={onComplete} />);
    ['1', '2', '3'].forEach((n) => fireEvent.click(screen.getByRole('button', { name: n })));
    fireEvent.click(screen.getByRole('button', { name: /지우기|backspace|⌫/i }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onComplete).toHaveBeenCalledWith('1245');
  });

  it('error prop true → shake 클래스 적용 + 입력 클리어', () => {
    const { rerender, container } = render(<PinPad onComplete={() => {}} error={false} />);
    const indicators = container.querySelector('[data-testid="pin-indicators"]');
    expect(indicators?.className).not.toContain('animate-shake');
    rerender(<PinPad onComplete={() => {}} error={true} />);
    expect(container.querySelector('[data-testid="pin-indicators"]')?.className).toContain(
      'animate-shake'
    );
  });
});
```

- [ ] **Step 2: FAIL 확인 + 구현**

```tsx
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function PinPad({ onComplete, error, disabled }: Props) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (error) setPin('');
  }, [error]);

  const push = (d: string) => {
    if (disabled) return;
    setPin((p) => {
      if (p.length >= 4) return p;
      const next = p + d;
      if (next.length === 4) {
        setTimeout(() => onComplete(next), 0);
      }
      return next;
    });
  };
  const back = () => {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        data-testid="pin-indicators"
        className={cn('flex gap-3', error && 'animate-shake')}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-all',
              pin.length > i ? 'bg-coral-500 border-coral-500' : 'border-ink-300'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => push(n)}
            disabled={disabled}
            className="h-16 rounded-2xl bg-white shadow-soft text-3xl font-black text-ink-900 hover:shadow-pop active:scale-95 disabled:opacity-40"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPin('')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-sm font-bold text-ink-500"
          aria-label="지우기"
        >
          지우기
        </button>
        <button
          type="button"
          onClick={() => push('0')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-3xl font-black text-ink-900 hover:shadow-pop active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-2xl text-ink-500"
          aria-label="backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 테스트 PASS + Commit**

```bash
pnpm --filter @tangobook/client test -- PinPad.test.tsx
git add packages/client/src/features/auth/components/PinPad.tsx packages/client/src/features/auth/components/PinPad.test.tsx
git commit -m "feat(auth): PinPad — 4-digit number keypad with shake-on-error"
```

### Task 3.3: `ProfileCreateModal` (TDD, 3 tests)

**Files:**
- Create: `packages/client/src/features/auth/components/ProfileCreateModal.tsx`
- Create: `packages/client/src/features/auth/components/ProfileCreateModal.test.tsx`

**사양 상세**:
- Props: `{ open: boolean; mode: 'create' | 'edit'; initial?: ChildProfile; onSubmit: (input: ProfileInput) => Promise<void>; onCancel: () => void; onDelete?: () => Promise<void>; }`
- `ProfileInput = { name: string; avatarId: AvatarId; birthDate: string | null }`
- 필드:
  - `AvatarPicker` (value/onChange)
  - 이름 input: `maxLength={10}`, `placeholder="이름"`, HTML5 required
  - 생년월일: `<input type="date">` — **선택 필드** (null 허용, empty string → null 변환)
- Submit 버튼 `disabled` 조건: `name.trim().length === 0 || !avatarId` (birthDate는 선택)
- Edit 모드: `initial` 값으로 폼 prefill, 하단에 `삭제` 버튼. 탭 → `window.confirm('{name} 프로필을 삭제할까요? 학습 기록도 사라져요.')` → OK면 `await onDelete()`. 미리 제공된 onDelete 콜백이 실제 API를 호출
- 모달 컨벤션: 배경 `fixed inset-0 bg-black/60`, 배경 탭 → `onCancel`, ESC 키 → `onCancel` (useEffect keydown 리스너). 내부 카드 `bg-white rounded-2xl p-6 max-w-md`
- 기존 뷰어 톤: 버튼 coral-500 primary, 텍스트 text-ink-900, 제목 `text-2xl font-black`

- [ ] **Step 1: 실패 테스트 작성 (3 tests)**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCreateModal } from './ProfileCreateModal';

describe('ProfileCreateModal', () => {
  it('이름이 비어있으면 저장 버튼 disabled', () => {
    render(
      <ProfileCreateModal open mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    const submit = screen.getByRole('button', { name: /저장|만들기|완료/ });
    expect(submit).toBeDisabled();
  });

  it('이름 11자 입력 시도해도 maxLength=10으로 막힘', () => {
    render(
      <ProfileCreateModal open mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    const input = screen.getByPlaceholderText('이름') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '가나다라마바사아자차카' } });
    expect(input.value.length).toBeLessThanOrEqual(10);
  });

  it('정상 제출 → onSubmit({ name, avatarId, birthDate }) 호출', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileCreateModal open mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText('이름');
    fireEvent.change(input, { target: { value: '지민' } });
    const hori = screen.getByRole('button', { name: /아바타 hori/ });
    fireEvent.click(hori);
    const submit = screen.getByRole('button', { name: /저장|만들기|완료/ });
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({
      name: '지민',
      avatarId: 'hori',
      birthDate: null,
    });
  });
});
```

- [ ] **Step 2: FAIL 확인 + 구현**

```tsx
import { useEffect, useState } from 'react';
import type { ChildProfile, AvatarId } from '@tangobook/shared';
import { AvatarPicker } from './AvatarPicker';
import { cn } from '@/lib/cn';

export interface ProfileInput {
  name: string;
  avatarId: AvatarId;
  birthDate: string | null;
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ChildProfile;
  onSubmit: (input: ProfileInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function ProfileCreateModal({ open, mode, initial, onSubmit, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(initial?.avatarId ?? null);
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      // 리셋
      setName(initial?.name ?? '');
      setAvatarId(initial?.avatarId ?? null);
      setBirthDate(initial?.birthDate ?? '');
      setBusy(false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && !!avatarId && !busy;

  const handleSubmit = async () => {
    if (!canSubmit || !avatarId) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        avatarId,
        birthDate: birthDate.trim() === '' ? null : birthDate,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initial) return;
    const ok = window.confirm(
      `${initial.name} 프로필을 삭제할까요? 학습 기록도 사라져요.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-ink-900 mb-4">
          {mode === 'create' ? '아이 프로필 만들기' : '아이 프로필 편집'}
        </h2>
        <div className="space-y-4">
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl border-2 border-ink-100 text-ink-900 text-lg font-bold focus:border-coral-500 outline-none"
          />
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-ink-100 text-ink-900 text-lg focus:border-coral-500 outline-none"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white border-2 border-ink-100 text-ink-900 font-bold"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex-1 py-3 rounded-xl font-black text-white',
              canSubmit ? 'bg-coral-500 hover:brightness-110' : 'bg-ink-300 cursor-not-allowed'
            )}
          >
            {mode === 'create' ? '만들기' : '저장'}
          </button>
        </div>
        {mode === 'edit' && onDelete && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="mt-3 text-danger text-sm font-bold hover:underline w-full text-center"
          >
            🗑️ 이 프로필 삭제
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 테스트 PASS + typecheck + Commit**

```bash
pnpm --filter @tangobook/client test -- ProfileCreateModal.test.tsx
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/components/ProfileCreateModal.tsx packages/client/src/features/auth/components/ProfileCreateModal.test.tsx
git commit -m "feat(auth): ProfileCreateModal with validation + delete confirm + ESC/backdrop"
```

### Task 3.4: `ProfilePicker` (TDD, 3 tests)

**Files:**
- Create: `packages/client/src/features/auth/components/ProfilePicker.tsx`
- Create: `packages/client/src/features/auth/components/ProfilePicker.test.tsx`

**사양**:
- Props: `{ profiles: ChildProfile[]; onSelect: (p: ChildProfile) => void; onAddNew: () => void; }`
- `canAddNew = profiles.length < 4`
- 그리드 `grid grid-cols-2 sm:grid-cols-4 gap-4`
- 각 카드: `AvatarRender size="lg"` + 이름 + 나이(생년월일 있으면) — 카드 `bg-white rounded-2xl p-4 shadow-soft hover:scale-105`
- `canAddNew=true`일 때만 `+ 새 아이 추가` 버튼 타일 추가
- **Empty state** (profiles.length === 0): `onAddNew` 자동 호출 (useEffect). 즉 빈 state는 ProfileCreateModal 자동 오픈
- 배경 제목 `누가 놀고 있어요?` (`text-3xl font-black text-ink-900 text-center mb-8`)

- [ ] **Step 1: 실패 테스트 작성 (3 tests)**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePicker } from './ProfilePicker';
import type { ChildProfile } from '@tangobook/shared';

const mkProfile = (id: string, name: string): ChildProfile => ({
  id,
  accountId: 'acc1',
  name,
  avatarId: 'hori',
  birthDate: null,
  lastActiveAt: null,
  createdAt: '2026-04-23T00:00:00Z',
});

describe('ProfilePicker', () => {
  it('profiles 3명 + `+ 새 아이 추가` 버튼 렌더', () => {
    const profiles = [mkProfile('p1', '지민'), mkProfile('p2', '서연'), mkProfile('p3', '민준')];
    render(<ProfilePicker profiles={profiles} onSelect={vi.fn()} onAddNew={vi.fn()} />);
    expect(screen.getByText('지민')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /새 아이|추가/ })).toBeInTheDocument();
  });

  it('profiles 4명 한도 → `+` 버튼 숨김', () => {
    const profiles = ['p1', 'p2', 'p3', 'p4'].map((id, i) => mkProfile(id, `c${i}`));
    render(<ProfilePicker profiles={profiles} onSelect={vi.fn()} onAddNew={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /새 아이|추가/ })).toBeNull();
  });

  it('카드 탭 → onSelect(profile) 호출', () => {
    const onSelect = vi.fn();
    const profiles = [mkProfile('p1', '지민')];
    render(<ProfilePicker profiles={profiles} onSelect={onSelect} onAddNew={vi.fn()} />);
    fireEvent.click(screen.getByText('지민').closest('button')!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });
});
```

- [ ] **Step 2: FAIL 확인 + 구현**

```tsx
import { useEffect } from 'react';
import type { ChildProfile } from '@tangobook/shared';
import { AvatarRender } from './AvatarRender';

interface Props {
  profiles: ChildProfile[];
  onSelect: (p: ChildProfile) => void;
  onAddNew: () => void;
}

function ageFromBirth(birthDate: string | null): string {
  if (!birthDate) return '';
  const b = new Date(birthDate);
  const now = new Date();
  const diff = now.getFullYear() - b.getFullYear();
  return `만 ${diff}세`;
}

export function ProfilePicker({ profiles, onSelect, onAddNew }: Props) {
  const canAddNew = profiles.length < 4;

  // 빈 state → 자동으로 추가 모달 유도
  useEffect(() => {
    if (profiles.length === 0) onAddNew();
  }, [profiles.length, onAddNew]);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-cream-50 to-peach-100 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-ink-900 text-center mb-8">누가 놀고 있어요?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop transition-all flex flex-col items-center gap-2"
            >
              <AvatarRender id={p.avatarId} size="lg" />
              <div className="text-xl font-black text-ink-900">{p.name}</div>
              {p.birthDate && <div className="text-sm text-ink-500">{ageFromBirth(p.birthDate)}</div>}
            </button>
          ))}
          {canAddNew && (
            <button
              onClick={onAddNew}
              aria-label="새 아이 추가"
              className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop transition-all flex flex-col items-center justify-center text-5xl text-coral-500 font-black min-h-[160px]"
            >
              +
              <span className="text-sm text-ink-700 mt-2">새 아이 추가</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 테스트 PASS + typecheck + Commit**

```bash
pnpm --filter @tangobook/client test -- ProfilePicker.test.tsx
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/components/ProfilePicker.tsx packages/client/src/features/auth/components/ProfilePicker.test.tsx
git commit -m "feat(auth): ProfilePicker grid with 4-child limit + empty-state auto-add"
```

### Task 3.5: `ParentGateModal` + `ParentCornerButton`

**Files:**
- Create: `packages/client/src/features/auth/components/ParentGateModal.tsx`
- Create: `packages/client/src/features/auth/components/ParentCornerButton.tsx`

**ParentGateModal 사양**:
- Props: `{ open: boolean; onClose: () => void; onSuccess: () => void; }`
- 내부 상태: `error` (boolean, `useParentGate.registerFailure` 직후 true → 500ms 후 false. PinPad가 error prop으로 shake)
- `useParentGate()` 훅에서 `isLockedOut`, `registerFailure`, `unlock` 사용
- PIN 입력 flow:
  1. PinPad `onComplete(pin)` → `authApi.verifyPin(pin)`
  2. true → `unlock()` + `onSuccess()` (호출자가 modal close + 네비게이션)
  3. false → `registerFailure()` + `setError(true)` → 500ms 뒤 `setError(false)` (PinPad 자동 clear)
- `isLockedOut=true`면 PinPad 전체 disabled + **잠금 남은 시간 카운트다운 표시** ("60초 후 다시 시도해주세요")
- 배경 `fixed inset-0 bg-black/70 backdrop-blur-sm`, 중앙 카드에 호리 `thinking` Mascot + "부모님만 들어올 수 있어요" 텍스트
- 배경 탭 → `onClose` (모달 닫힘, 잠금 상태 보존)

**구현**:

```tsx
import { useEffect, useState } from 'react';
import { Mascot } from '@/components/Mascot';
import { PinPad } from './PinPad';
import { useParentGate } from '../hooks/useParentGate';
import { authApi } from '../api/auth.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ParentGateModal({ open, onClose, onSuccess }: Props) {
  const gate = useParentGate();
  const [error, setError] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);

  // Lockout 카운트다운 표시
  useEffect(() => {
    if (!gate.isLockedOut) {
      setRemainingSec(0);
      return;
    }
    const tick = () => {
      // useParentGate lockedUntil 직접 읽을 수 없으니 근사치로 60초 카운트
      setRemainingSec((s) => Math.max(0, s > 0 ? s - 1 : 60));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gate.isLockedOut]);

  if (!open) return null;

  const handleComplete = async (pin: string) => {
    if (gate.isLockedOut) return;
    try {
      const ok = await authApi.verifyPin(pin);
      if (ok) {
        gate.unlock();
        onSuccess();
        return;
      }
    } catch {
      // network 에러 — 오답 취급
    }
    gate.registerFailure();
    setError(true);
    setTimeout(() => setError(false), 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Mascot state="thinking" size="md" character="hori" />
        <h2 className="text-xl font-black text-ink-900">부모님만 들어올 수 있어요</h2>
        {gate.isLockedOut ? (
          <p className="text-danger font-bold text-center">
            잠깐만 쉬었다 다시 해주세요<br />({remainingSec}초 남음)
          </p>
        ) : (
          <PinPad onComplete={handleComplete} error={error} disabled={gate.isLockedOut} />
        )}
        <button onClick={onClose} className="text-ink-500 text-sm font-bold mt-2">
          닫기
        </button>
      </div>
    </div>
  );
}
```

**ParentCornerButton 사양**:
- Props: 없음 (내부 `useAuth` + `useNavigate` 사용)
- 동작:
  - `isConfigured=false` → `return null`
  - `!session` (게스트) → `button onClick={() => navigate('/login')}` "🔒 부모"
  - `session` (로그인) → "👤 부모님 영역" 버튼. 탭 → `ParentGateModal` open. 성공 시 modal close + `navigate('/parent')`
  - 이미 `parentGate.isUnlocked`면 modal 생략하고 바로 `/parent` navigate (재진입 UX)
- 스타일: `px-3 py-2 rounded-full bg-white shadow-soft text-ink-900 font-bold text-sm`

**구현**:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParentGate } from '../hooks/useParentGate';
import { ParentGateModal } from './ParentGateModal';

export function ParentCornerButton() {
  const { isConfigured, session } = useAuth();
  const gate = useParentGate();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!isConfigured) return null;

  const handleClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (gate.isUnlocked) {
      navigate('/parent');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-3 py-2 rounded-full bg-white shadow-soft text-ink-900 font-bold text-sm hover:shadow-pop"
      >
        {session ? '👤 부모님 영역' : '🔒 부모'}
      </button>
      <ParentGateModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          navigate('/parent');
        }}
      />
    </>
  );
}
```

- [ ] **Step 1: 두 컴포넌트 구현**
- [ ] **Step 2: typecheck**
- [ ] **Step 3: Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/components/ParentGateModal.tsx packages/client/src/features/auth/components/ParentCornerButton.tsx
git commit -m "feat(auth): ParentGateModal (PIN verify + lockout) + ParentCornerButton"
```

### Task 3.6: Chunk 3 sanity

- [ ] typecheck · test 전체 PASS (기존 + 신규 ~9 테스트 = 3 PinPad + 3 ProfileCreateModal + 3 ProfilePicker)

**🏁 Chunk 3 완료 기준:**
- [ ] Avatar 시스템·PinPad·ProfileCreateModal·ProfilePicker·ParentGateModal·ParentCornerButton 구현
- [ ] 신규 테스트 ~9 PASS

---

## Chunk 4: 페이지·라우트·가드·LoginPage multi-step

**목표:** `/login`, `/login/callback`, `/parent/*` 라우트 구축. LoginPage의 4단계 state machine (auth → setPin → profile → done).

**기간:** 1~1.5일

### Task 4.1: `RequireAuthed` + `RequireAuthedWithPin` 가드 (TDD)

**Files:**
- Create: `packages/client/src/features/auth/guards/RequireAuthed.tsx`
- Create: `packages/client/src/features/auth/guards/RequireAuthedWithPin.tsx`
- Create: `packages/client/src/features/auth/guards/RequireAuthedWithPin.test.tsx`

**사양 구분**:

**`RequireAuthed`** (세션만 요구):
- `!isConfigured` → `<Navigate to="/library" replace />` (Supabase 미설정 시 로그인 영역 자체가 존재하지 않음)
- `!session` → `<Navigate to="/login" replace />`
- pass → `children` 렌더
- PIN 검증·Gate 모달 없음
- 사용처: `/login/callback` (없음 — 자체가 session 수립 지점) · 필요 시 향후 리포트 embed 페이지

**`RequireAuthedWithPin`** (세션 + PIN + Gate 통과):
- `!isConfigured` → `<Navigate to="/library" replace />`
- `!session` → `<Navigate to="/login" replace />`
- `session && !account?.hasPin` → `<SetPinStep onComplete={refresh} />` 인라인 렌더 (라우트 유지, 완료 시 다시 평가)
- `session && account.hasPin && !gate.isUnlocked` → `<ParentGateModal open onClose={() => navigate('/library')} onSuccess={() => {}} />` 인라인 렌더 (children 대신). 닫으면 라이브러리로
- 모두 통과 → `children` 렌더
- 사용처: `/parent/*` 전 구간

**redirect 쿼리**: 이번 스펙에서는 `?next=` 같은 복귀 URL 유지 안 함(YAGNI). 모두 `/login` 또는 `/library`로.

- [ ] **Step 1: 실패 테스트 작성 (5 tests)**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuthedWithPin } from './RequireAuthedWithPin';
import * as authCtx from '../context/AuthContext';
import * as gateHook from '../hooks/useParentGate';

function setup(mockAuth: Partial<ReturnType<typeof authCtx.useAuth>>, mockGate: Partial<ReturnType<typeof gateHook.useParentGate>>) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    isConfigured: true,
    loading: false,
    session: null,
    account: null,
    profiles: [],
    activeProfile: null,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
    ...mockAuth,
  } as any);
  vi.spyOn(gateHook, 'useParentGate').mockReturnValue({
    isUnlocked: false,
    isLockedOut: false,
    failureCount: 0,
    unlock: vi.fn(),
    lock: vi.fn(),
    registerFailure: vi.fn(),
    ...mockGate,
  } as any);
}

describe('RequireAuthedWithPin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('isConfigured=false → /library redirect', () => {
    setup({ isConfigured: false }, {});
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <Routes>
          <Route path="/parent" element={<RequireAuthedWithPin><div>PROTECTED</div></RequireAuthedWithPin>} />
          <Route path="/library" element={<div>LIBRARY</div>} />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LIBRARY')).toBeInTheDocument();
  });

  it('unauthed → /login redirect', () => {
    setup({ session: null }, {});
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <Routes>
          <Route path="/parent" element={<RequireAuthedWithPin><div>PROTECTED</div></RequireAuthedWithPin>} />
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/library" element={<div>LIBRARY</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('session + hasPin=false → SetPinStep 렌더 (children 차단)', () => {
    setup({ session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: false } as any }, {});
    render(
      <MemoryRouter>
        <RequireAuthedWithPin><div>PROTECTED</div></RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.getByText(/PIN/i)).toBeInTheDocument(); // SetPinStep heading
  });

  it('session + hasPin + gate.isUnlocked=false → ParentGateModal 렌더', () => {
    setup(
      { session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: true } as any },
      { isUnlocked: false }
    );
    render(
      <MemoryRouter>
        <RequireAuthedWithPin><div>PROTECTED</div></RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.getByText(/부모님만/)).toBeInTheDocument();
  });

  it('세션 + PIN + gate 통과 → children 렌더', () => {
    setup(
      { session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: true } as any },
      { isUnlocked: true }
    );
    render(
      <MemoryRouter>
        <RequireAuthedWithPin><div>PROTECTED</div></RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 구현**

```tsx
// RequireAuthed.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuthed({ children }: { children: ReactNode }) {
  const { isConfigured, session, loading } = useAuth();
  if (loading) return null;
  if (!isConfigured) return <Navigate to="/library" replace />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

```tsx
// RequireAuthedWithPin.tsx
import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParentGate } from '../hooks/useParentGate';
import { SetPinStep } from '../components/SetPinStep';
import { ParentGateModal } from '../components/ParentGateModal';

export function RequireAuthedWithPin({ children }: { children: ReactNode }) {
  const { isConfigured, session, account, loading, refresh } = useAuth();
  const gate = useParentGate();
  const navigate = useNavigate();

  if (loading) return null;
  if (!isConfigured) return <Navigate to="/library" replace />;
  if (!session) return <Navigate to="/login" replace />;
  if (!account?.hasPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <SetPinStep onComplete={async () => { await refresh(); }} />
      </div>
    );
  }
  if (!gate.isUnlocked) {
    return (
      <ParentGateModal
        open
        onClose={() => navigate('/library')}
        onSuccess={() => { /* gate 자체가 isUnlocked 를 true로 만들어 이 컴포넌트 재렌더 */ }}
      />
    );
  }
  return <>{children}</>;
}
```

- [ ] **Step 3: 테스트 PASS + Commit**

```bash
pnpm --filter @tangobook/client test -- RequireAuthedWithPin.test.tsx
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/auth/guards/
git commit -m "feat(auth): route guards (RequireAuthed / RequireAuthedWithPin) + 5 tests"
```

### Task 4.2: `LoginPage` + `SignInForm` + `SignUpForm` + `SetPinStep` + `ProfileCreateStep`

**Files:**
- Create: `packages/client/src/features/auth/components/LoginPage.tsx`
- Create: `packages/client/src/features/auth/components/SignInForm.tsx`
- Create: `packages/client/src/features/auth/components/SignUpForm.tsx`
- Create: `packages/client/src/features/auth/components/SetPinStep.tsx`
- Create: `packages/client/src/features/auth/components/ProfileCreateStep.tsx`

**LoginPage step 결정 테이블** (session·account·profiles·`?pinReset=1` 입력으로부터 계산):

| session | account.hasPin | profiles.length | ?pinReset | step |
|---|---|---|---|---|
| null | — | — | — | `auth` |
| exists | false | any | any | `setPin` |
| exists | true | any | **true** | `setPin` (강제 override) |
| exists | true | 0 | false | `profile` |
| exists | true | ≥1 | false | `done` → `/library` navigate |

```tsx
// LoginPage.tsx 핵심 로직
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { SetPinStep } from './SetPinStep';
import { ProfileCreateStep } from './ProfileCreateStep';

type Step = 'auth' | 'setPin' | 'profile' | 'done';

function computeStep(
  session: unknown,
  hasPin: boolean | undefined,
  profileCount: number,
  pinReset: boolean
): Step {
  if (!session) return 'auth';
  if (pinReset) return 'setPin';
  if (!hasPin) return 'setPin';
  if (profileCount === 0) return 'profile';
  return 'done';
}

export default function LoginPage() {
  const { session, account, profiles, loading } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const pinReset = sp.get('pinReset') === '1';
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');

  const step: Step = useMemo(
    () => computeStep(session, account?.hasPin, profiles.length, pinReset),
    [session, account, profiles.length, pinReset]
  );

  // step === 'done' → /library
  useEffect(() => {
    if (step === 'done') navigate('/library', { replace: true });
  }, [step, navigate]);

  // pinReset 처리 완료 시 쿼리 비우기
  useEffect(() => {
    if (pinReset && step === 'setPin') {
      // 첫 렌더 후 URL에서 pinReset 제거 (반복 방지)
      const t = setTimeout(() => {
        sp.delete('pinReset');
        setSp(sp, { replace: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [pinReset, step, sp, setSp]);

  if (loading) return null;

  if (step === 'auth') {
    return authMode === 'signIn' ? (
      <SignInForm onSwitchToSignUp={() => setAuthMode('signUp')} />
    ) : (
      <SignUpForm onSwitchToSignIn={() => setAuthMode('signIn')} />
    );
  }
  if (step === 'setPin') return <SetPinStep />;
  if (step === 'profile') return <ProfileCreateStep />;
  return null;
}
```

**SignInForm**:
- Props: `{ onSwitchToSignUp: () => void }`
- email · password input (both `h-14 text-xl rounded-xl border-2 border-ink-100 focus:border-coral-500`)
- `로그인` button → `authApi.signIn(email, password)`. 에러 alert.
- `Google로 계속` button → `authApi.signInWithGoogle()`.
- 하단 링크 3개:
  - `회원가입` → `onSwitchToSignUp`
  - `비밀번호 찾기` → `supabase.auth.resetPasswordForEmail(email)` (간단 toast, 이번 스펙은 별도 페이지 없이 이메일 안내만)
  - `PIN 잊었어요` → 이메일 입력 prompt → `authApi.requestPinReset(email)` → 성공 toast 고정 ("이메일 보냈어요. 확인해주세요.")

**SignUpForm**:
- Props: `{ onSwitchToSignIn: () => void }`
- email · password · password 확인 → 매칭 검증 + `authApi.signUp`. 성공 → "확인 이메일을 보냈어요" toast + SignIn 탭으로 전환
- `Google로 계속` 버튼

**SetPinStep**:
- Props 없음 (AuthContext에서 refresh)
- 로컬 state: `phase: 'first' | 'confirm'`, `firstPin: string | null`, `error: boolean`
- first → PinPad `onComplete` 받으면 저장 + phase='confirm'
- confirm → PinPad `onComplete` 값이 firstPin과 match → `authApi.setPin(pin)` → `refresh()` → (LoginPage step 자동 재계산)
- mismatch → error true 500ms + firstPin=null + phase='first' 되돌림
- 호리 `thinking` 마스코트 + "부모님만 볼 영역을 보호해요 🔒" 문구

**ProfileCreateStep**:
- Props 없음
- `ProfileCreateModal`을 재사용할 수도 있지만 full-screen 느낌이 맞음 — 내부 폼은 `AvatarPicker` + 이름 + 생일 필드만 직접 배치 (모달 아님)
- 성공 시 `profilesApi.create` → `setActiveProfile(newOne)` → LoginPage의 step이 'done'으로 자동 재계산 → navigate

- [ ] **Step 1: LoginPage + 4개 보조 컴포넌트 구현**
- [ ] **Step 2: typecheck**
- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/auth/components/LoginPage.tsx packages/client/src/features/auth/components/SignInForm.tsx packages/client/src/features/auth/components/SignUpForm.tsx packages/client/src/features/auth/components/SetPinStep.tsx packages/client/src/features/auth/components/ProfileCreateStep.tsx
git commit -m "feat(auth): LoginPage state machine (auth → setPin → profile → done) + forms"
```

### Task 4.3: `/login/callback` (`LoginCallback.tsx`)

**Files:**
- Create: `packages/client/src/pages/LoginCallback.tsx`

OAuth 복귀·magic link 복귀를 받아 세션 수립 완료 후 `/login`으로 돌려보냄. `?pinReset=1`이면 `/login?pinReset=1`로 전달 (LoginPage가 SetPinStep 강제).

- [ ] **Step 1: 구현**

```tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginCallback() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  useEffect(() => {
    // Supabase SDK는 URL hash에서 tokens 자동 exchange
    const pinReset = sp.get('pinReset') === '1';
    const t = setTimeout(() => {
      navigate(pinReset ? '/login?pinReset=1' : '/login', { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [navigate, sp]);
  return <div className="min-h-screen flex items-center justify-center text-ink-900">로그인 처리 중…</div>;
}
```

- [ ] **Step 2: Commit**

### Task 4.4: Parent Pages (shell) + 라우트 등록

**Files:**
- Create: `packages/client/src/features/auth/pages/ParentHomePage.tsx`
- Create: `packages/client/src/features/auth/pages/ParentProfilesPage.tsx`
- Create: `packages/client/src/features/auth/pages/ParentSettingsPage.tsx`
- Modify: `packages/client/src/router/index.tsx` — `/login`, `/login/callback`, `/parent/*` 라우트
- Modify: `packages/client/src/main.tsx` — `<AuthProvider>` 래핑
- Modify: `packages/client/src/pages/LibraryPage.tsx` — `<ParentCornerButton>` + `activeProfile` 배지

**`ParentHomePage`**:
- 상단 네비 탭 3개 (`📊 학습 리포트` / `👦 자녀` / `⚙️ 설정`) — 탭 클릭 시 해당 서브라우트로 navigate (`/parent/reports`·`/parent/profiles`·`/parent/settings`)
- 기본 진입(`/parent`)은 `/parent/profiles`로 자동 redirect
- `📊 학습 리포트`(`/parent/reports`)는 이번 스펙 범위 밖 — placeholder: 호리 `sleeping` + "곧 공개돼요 🚧" — 실제 구현은 다음 스펙
- 우상단 로그아웃 버튼 `🚪` → `useAuth().signOut()` + `/library` navigate

**`ParentProfilesPage`**:
- `ProfilePicker`와 UX 비슷하지만 **편집 모드**가 켜진 버전
- 각 프로필 카드 탭 → `ProfileCreateModal` 편집 모드(`mode='edit'`, `initial=profile`) 오픈
- modal `onSubmit` → `profilesApi.update(id, input)` + `refresh`
- modal `onDelete` → `profilesApi.delete(id)` + `refresh` + 삭제한 것이 activeProfile이면 `setActiveProfile(null)`
- `+ 새 아이 추가` 카드 → modal 생성 모드
- modal `onSubmit` (create) → `profilesApi.create(...)` + `refresh` + 첫 프로필이면 `setActiveProfile(newOne)`

**`ParentSettingsPage`**:
- 3개 섹션:
  1. **PIN 변경** — `ChangePinStep` 컴포넌트 (별도 파일). 현재 PIN 확인 → 새 PIN 입력 → 재확인:
     - Phase 1 `verifyCurrent`: `PinPad` + `authApi.verifyPin(currentPin)`. 틀리면 shake + 재입력. 3회 오답 시 60초 lockout(재사용 `useParentGate.registerFailure`)
     - Phase 2 `newFirst`: 새 PIN 입력
     - Phase 3 `newConfirm`: 재입력 → match → `authApi.setPin(newPin)` → refresh → 성공 toast
  2. **로그아웃** — 버튼 `🚪 로그아웃` → `signOut()` + `/library`
  3. **계정 삭제** — 위험 구역 빨간 배경. 탭 → 모달 2단계 confirm ("정말 삭제할까요? 모든 자녀 프로필과 학습 기록이 사라져요" → "다시 한 번, 삭제하면 되돌릴 수 없어요"). 둘 다 OK → `authApi.deleteAccount()` → `/library`

> **왜 `SetPinStep` 재사용 안 함**: `SetPinStep`은 신규 설정용이라 현재 PIN 확인 단계가 없음. PIN 변경은 보안상 **현재 PIN 검증 → 새 PIN 설정** 2단계 필수. 별도 `ChangePinStep` 컴포넌트 작성.

- [ ] **Step 1~5: 구현 + typecheck + Commit**

```bash
git add packages/client/src/features/auth/pages/ packages/client/src/pages/LoginCallback.tsx packages/client/src/router/index.tsx packages/client/src/main.tsx packages/client/src/pages/LibraryPage.tsx
git commit -m "feat(auth): /parent/* pages + router wiring + LibraryPage ParentCornerButton"
```

### Task 4.5: Chunk 4 sanity

- [ ] 전체 typecheck + test PASS
- [ ] 수동 smoke: 로컬 dev에서 `/login` 방문 (Supabase env 없음 — 기능 비활성 확인), env 설정 후 빈 프로젝트로 회원가입 end-to-end (별도 Supabase 셋업이 필요해 이 단계는 사용자 수동 QA)

**🏁 Chunk 4 완료 기준:**
- [ ] 라우트 + Provider + LoginPage state machine 완성
- [ ] `/parent` 진입 시 PIN 필요 (가드 + 모달)
- [ ] `LibraryPage`에 `ParentCornerButton` 노출 (isConfigured 기반 조건부)

---

## Chunk 5: 최종 sanity + 문서

**목표:** 전체 테스트·typecheck·build·lint 통과 확인 + CLAUDE.md·memory·env 문서 업데이트. 최종 `git push`는 **수행하지 않음** (사용자가 수동으로).

**기간:** 0.5일

### Task 5.1: 전체 통합 sanity

- [ ] **Step 1: 모든 패키지 typecheck + test + build + lint**

```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/server typecheck
pnpm --filter @tangobook/server test
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
pnpm --filter @tangobook/client build
pnpm --filter @tangobook/remotion build  # (skip if config has no build script — check first)
pnpm lint                                  # 전 워크스페이스 ESLint
```
Expected:
- client test 기존 60 + 신규 ~28 = **~88 tests PASS**
- server test 기존 4 PASS (변경 없음)
- 전체 build 성공
- lint 기존 대비 추가 무에러 (기존 remotion 미해결 경고는 그대로 — 이번 스펙 무관)

실패 시 Chunk 5 중단 + 원인 수정 후 재실행. 기존 pre-existing lint 경고(remotion/src/**)는 이번 스펙 스코프 밖이니 건드리지 않음.

### Task 5.2: CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 환경변수 섹션에 Supabase env 추가**

```
## 환경변수 (추가)
- 선택 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - 로그인/계정 기능 활성화용. 없으면 게스트 모드만 동작 (graceful degradation)
  - 셋업: `scripts/supabase-setup.sql`을 Supabase SQL Editor에 실행 후 Project Settings > API에서 URL·anon key 복사
```

- [ ] **Step 2: Feature 구조 섹션에 auth 추가**

```
## Auth Feature 구조 (2026-04-23 로그인 시스템)
- packages/client/src/features/auth/ — Supabase auth wrapper
- 부모 계정 (Email/PW + Google OAuth) + 자녀 프로필 최대 4명
- PIN 4자리 pgcrypto 해싱, 15분 memoize, 60초 3회 lockout
- localStorage → learning_events 자동 마이그레이션 (플러그인 레지스트리)
- 게스트 모드 호환: isSupabaseConfigured=false면 ParentCornerButton 숨김
- Edge Function: supabase/functions/reset-pin/index.ts (PIN 분실 magic link)
- 스펙: docs/superpowers/specs/2026-04-23-auth-login-design.md
- 플랜: docs/superpowers/plans/2026-04-23-auth-login-plan.md
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md auth/login feature section + env vars"
```

### Task 5.3: Memory 업데이트

**Files:**
- Create: `C:\Users\101024\.claude\projects\C--projects-tangobook\memory\auth-login-complete.md`
- Modify: `C:\Users\101024\.claude\projects\C--projects-tangobook\memory\MEMORY.md`

- [ ] **Step 1: `auth-login-complete.md` 작성**

기존 `viewer-redesign-complete.md`·`games-overhaul-2026-04-23.md` 패턴 따르기. 템플릿:

```markdown
---
name: Auth/Login System Complete
description: Supabase 기반 부모 계정 + 자녀 프로필 + PIN + 마이그레이션 — 학습 리포팅 이니셔티브의 첫 서브시스템
type: project
---

## 상태 (2026-04-__ 완료)

뷰어에 로그인 시스템 도입. 게스트 모드 100% 호환. 학습 이벤트 수집·리포트·뱃지는 별도 후속 스펙.

## Chunk 요약

### Chunk 1 — Foundation (commits <hashA> · <hashB> · ...)
- shared 타입: Account, ChildProfile, AvatarId, LearningEvent
- Supabase 클라 싱글톤 + isSupabaseConfigured 가드
- scripts/supabase-setup.sql (테이블·RLS·PIN/delete RPC·트리거 전부)
- Edge Function reset-pin (Deno, rate-limited)

### Chunk 2 — API + Hooks (commits ...)
- auth.api · profiles.api supabase wrappers
- useSession · useCurrentAccount (트리거 race upsert fallback) · useActiveProfile
- AuthContext (runMigrations 자동 트리거)
- migrations 플러그인 레지스트리 (7 tests)
- useParentGate 훅 (5 tests)

### Chunk 3 — UI Components (commits ...)
- AvatarPicker (8종, hori WebP + 이모지 fallback)
- PinPad (3 tests)
- ProfileCreateModal (3 tests)
- ProfilePicker (3 tests)
- ParentGateModal · ParentCornerButton

### Chunk 4 — Routes + Pages (commits ...)
- RequireAuthed · RequireAuthedWithPin 가드 (5 tests)
- LoginPage 4-step state machine (auth/setPin/profile/done)
- /login/callback
- /parent/* (Home·Profiles CRUD·Settings + ChangePinStep)
- router wiring + AuthProvider + LibraryPage ParentCornerButton

### Chunk 5 — Sanity + Docs (commits ...)
- typecheck · test (~88) · build · lint PASS
- CLAUDE.md · memory · 스펙/플랜 완료 배너

## 주요 설계 결정

- **Netflix Kids 모델**: 부모 1 + 자녀 최대 4
- **선택적 로그인**: 게스트 모드 유지, Supabase env 미설정 시 graceful degradation
- **PIN 해싱**: pgcrypto DB 함수 (set_pin/verify_pin, SECURITY DEFINER). 클라 메모리에만 순간 평문
- **마이그레이션**: 플러그인 레지스트리 — 이후 스펙들이 `MIGRATIONS[]`에 1줄 추가로 확장
- **트리거 race 대응**: `useCurrentAccount`에서 `accounts` upsert fallback

## 알려진 미완 / 후속

- 제거된 아바타 7종 WebP (현재 이모지 fallback)
- 학습 이벤트 insert 심기 (다음 스펙)
- 어휘 마스터리 예측 (이후 스펙)
- `/parent/reports` placeholder 상태
- Kakao · Apple OAuth (필요 시)

## Supabase 수동 셋업 체크리스트

1. supabase.com 프로젝트 생성 (Seoul 리전 권장)
2. SQL Editor에 `scripts/supabase-setup.sql` 실행
3. Auth > Providers: Email, Google OAuth 활성화
4. Auth > URL Configuration: Site URL + redirect URLs (dev/prod)
5. Edge Function: `supabase functions deploy reset-pin --no-verify-jwt`
6. Edge Function env: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · PUBLIC_APP_URL
7. Railway 환경변수: VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY → 재배포
8. 수동 QA (스펙 §9.4)

## 테스트 요약

- Client: 60 → ~88 PASS (+28: migrations 7 · parentGate 5 · PinPad 3 · ProfileCreateModal 3 · ProfilePicker 3 · guards 5 + 기타)
- Server: 4 → 4 (변경 없음)
```

- [ ] **Step 2: `MEMORY.md`에 한 줄 엔트리 추가**

```
## Auth/Login System (2026-04-23)
See [auth-login-complete.md](auth-login-complete.md) — Supabase 기반 부모계정+자녀프로필+PIN, 게스트 호환, localStorage 마이그레이션, learning_events 테이블 shell.
```

### Task 5.4: 스펙·플랜 완료 배너

- [ ] **Step 1**: `docs/superpowers/specs/2026-04-23-auth-login-design.md` 맨 위 H1 바로 아래에 추가:

```markdown
> **✅ 구현 완료 (실제 완료일 YYYY-MM-DD로 치환)** — 플랜: `docs/superpowers/plans/2026-04-23-auth-login-plan.md`. 진행 상세: `memory/auth-login-complete.md`.
```

- [ ] **Step 2**: `docs/superpowers/plans/2026-04-23-auth-login-plan.md` H1 바로 아래에 추가:

```markdown
> **✅ 구현 완료 (실제 완료일 YYYY-MM-DD로 치환)** — 스펙: `docs/superpowers/specs/2026-04-23-auth-login-design.md`. 진행 상세: `memory/auth-login-complete.md`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-23-auth-login-design.md docs/superpowers/plans/2026-04-23-auth-login-plan.md
git commit -m "docs: mark auth/login spec+plan complete"
```

### Task 5.5: 최종 상태 보고 (사용자 수동 단계 안내)

- [ ] 사용자에게 제시할 릴리스 전 체크리스트:
  - [ ] supabase.com 프로젝트 생성 (Seoul)
  - [ ] `scripts/supabase-setup.sql` 실행
  - [ ] Auth Providers: Email 확인 메일 활성, Google OAuth 연결
  - [ ] Auth URL Configuration: Site URL + redirect URLs 등록
  - [ ] Edge Function 배포: `supabase functions deploy reset-pin --no-verify-jwt`
  - [ ] Railway env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가 → 재배포
  - [ ] 수동 QA (스펙 §9.4)
  - [ ] `git push origin main`

**🏁 Chunk 5 완료 기준:**
- [ ] typecheck·test·build·lint 전부 PASS
- [ ] CLAUDE.md·memory·스펙·플랜 배너 업데이트
- [ ] **최종 push는 사용자 수동** (이 플랜은 마지막 push 수행하지 않음 — 사용자 수동 단계에 포함)

---

## 🎉 플랜 종료

전체 완료 시:
- Supabase 기반 부모 계정·자녀 프로필·PIN 시스템 가동
- 뷰어 게스트 모드 완전 호환 유지
- `learning_events` shell 테이블 준비 (다음 스펙에서 write 시작)
- 학습 리포팅 전체 이니셔티브의 **첫 의존성 해결**

**다음 스펙(별도 브레인스토밍 사이클)**:
- 학습 이벤트 수집 (뷰어·게임에 `learning_events.insert` 심기)
- 어휘 마스터리 예측 (SQL aggregate + view)
- 리포팅 UI (`/parent/reports`)
- 뱃지·포인트 시스템
- 파닉스↔동화책 어휘 매핑
