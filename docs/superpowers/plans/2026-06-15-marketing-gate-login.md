# 마케팅 8054 게이트 자동 로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/marketing` 진입 시 이메일+비밀번호 Supabase 로그인 대신, 비밀번호(8054)만 입력하면 고정 계정(kil210@gmail.com) Supabase 세션을 자동 발급받아 들어가게 한다.

**Architecture:** client가 코드(8054)만 서버로 전송 → 서버 게이트 엔드포인트가 코드 검증 후 service-role로 매직링크 OTP를 발급·검증해 세션 토큰 반환(계정 비번 불필요, 비번이 클라이언트 번들에 안 실림) → client가 `supabase.auth.setSession()`. 기존 RLS 데이터·코드 그대로.

**Tech Stack:** Express + `@supabase/supabase-js`(admin generateLink/verifyOtp), React + react-router, Vitest.

---

## File Structure

- `packages/server/.env` — 환경변수 추가(gitignored).
- `packages/server/src/config/index.ts` — `mkt.gateCode`·`mkt.ownerEmail`·`supabase.anonKey` 추가.
- `packages/server/src/services/mkt/gate.service.ts` — 순수 `isValidGateCode` + 세션 발급 `mintOwnerSession`.
- `packages/server/src/controllers/mkt/gate.controller.ts` — `gateLogin` 핸들러.
- `packages/server/src/routes/mkt.routes.ts` — `POST /gate-login` 라우트(수정).
- `packages/server/src/services/mkt/gate.service.test.ts` — 순수 헬퍼 테스트.
- `packages/client/src/features/marketing/api/gate.ts` — `gateLogin(code)` client 호출.
- `packages/client/src/features/marketing/components/auth/MarketingGate.tsx` — 비밀번호 입력 UI.
- `packages/client/src/features/marketing/pages/MarketingLayout.tsx` — no-session 시 `/login` 리다이렉트 → `<MarketingGate/>` 렌더(수정).

기존 사실: `MarketingLayout`은 `useAuth()`의 `{session, loading}`을 사용. 세션은 `useSession()`이 `supabase.auth.onAuthStateChange`로 추적하므로, `supabase.auth.setSession()` 호출 시 자동 반영됨. 서버엔 `getSupabaseAdmin()`(service-role, `providers/supabase-admin.provider.ts`) 이미 존재. config는 `config.supabase.url`/`serviceRoleKey` 보유.

테스트: `pnpm --filter server test` (Vitest, config include `src/**/*.test.ts`). 타입체크 `pnpm --filter {server|client} typecheck`.

---

## Task 1: 환경변수 + config

**Files:**
- Modify: `packages/server/.env` (gitignored)
- Modify: `packages/server/src/config/index.ts`

- [ ] **Step 1: .env 추가** — `packages/server/.env` 끝에 append (Bash):
```bash
cat >> packages/server/.env <<'EOF'

# 마케팅 게이트 로그인 — 2026-06-15
MKT_GATE_CODE="8054"
MKT_OWNER_EMAIL="kil210@gmail.com"
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"   # 실제 값은 .env 에만(문서에 적지 말 것 — GitHub push protection 차단)
SUPABASE_ANON_KEY="<anon-key>"
EOF
```
Verify (sanitized): `grep -E "MKT_GATE_CODE|MKT_OWNER_EMAIL|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY" packages/server/.env | sed -E 's/(=).+/=<set>/'` → 5 lines.

- [ ] **Step 2: config 추가** — `packages/server/src/config/index.ts`의 `supabase` 객체에 `anonKey` 추가하고, 새 `mkt` 블록 추가. 기존:
```ts
  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
```
로 바꿔서:
```ts
  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  mkt: {
    gateCode: process.env.MKT_GATE_CODE ?? '',
    ownerEmail: process.env.MKT_OWNER_EMAIL ?? '',
  },
```
(주의: `supabase` 객체 닫는 중괄호 뒤 콤마 유지. 기존 다른 키 순서는 건드리지 말 것.)

- [ ] **Step 3: 타입체크**
Run: `pnpm --filter server typecheck`
Expected: 통과(에러 0).

- [ ] **Step 4: Commit**
```bash
git add packages/server/src/config/index.ts
git commit -m "feat(mkt-gate): config — gateCode/ownerEmail + supabase anonKey"
```
(`.env`는 gitignored — 커밋 안 됨.)

---

## Task 2: 게이트 서비스 (코드 검증 순수 + 세션 발급)

**Files:**
- Create: `packages/server/src/services/mkt/gate.service.ts`
- Test: `packages/server/src/services/mkt/gate.service.test.ts`

- [ ] **Step 1: Write failing test** — `gate.service.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isValidGateCode } from './gate.service';

describe('isValidGateCode', () => {
  it('정확히 일치할 때만 true', () => {
    expect(isValidGateCode('8054', '8054')).toBe(true);
  });
  it('공백 트림 후 비교', () => {
    expect(isValidGateCode(' 8054 ', '8054')).toBe(true);
  });
  it('불일치/빈값/미설정은 false', () => {
    expect(isValidGateCode('0000', '8054')).toBe(false);
    expect(isValidGateCode('', '8054')).toBe(false);
    expect(isValidGateCode('8054', '')).toBe(false); // expected 미설정 시 항상 거부
    expect(isValidGateCode(undefined, '8054')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**
Run: `pnpm --filter server exec vitest run src/services/mkt/gate.service.test.ts`
Expected: FAIL — `isValidGateCode` 없음.

- [ ] **Step 3: Implement** — `packages/server/src/services/mkt/gate.service.ts`:
```ts
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

/** 게이트 코드 검증(순수). expected 미설정('')이면 항상 false. */
export function isValidGateCode(input: string | undefined, expected: string): boolean {
  if (!expected) return false;
  return (input ?? '').trim() === expected;
}

/**
 * 고정 소유자 계정의 Supabase 세션을 발급한다(비밀번호 불필요).
 * service-role로 magiclink OTP를 생성 → anon 클라이언트로 verifyOtp → 세션 토큰.
 */
export async function mintOwnerSession(): Promise<{ access_token: string; refresh_token: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(502, 'Supabase 관리자 클라이언트가 설정되지 않았습니다.');
  const email = config.mkt.ownerEmail;
  if (!email) throw new AppError(502, 'MKT_OWNER_EMAIL 미설정.');
  if (!config.supabase.anonKey) throw new AppError(502, 'SUPABASE_ANON_KEY 미설정.');

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) {
    throw new AppError(502, `세션 발급 실패(generateLink): ${error?.message ?? 'no hashed_token'}`);
  }
  const tokenHash = data.properties.hashed_token;

  // anon 클라이언트로 OTP 검증 → 세션
  const anon = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const verify = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash });
  if (verify.error || !verify.data?.session) {
    throw new AppError(502, `세션 발급 실패(verifyOtp): ${verify.error?.message ?? 'no session'}`);
  }
  const { access_token, refresh_token } = verify.data.session;
  return { access_token, refresh_token };
}
```

- [ ] **Step 4: Run, expect PASS** (순수 헬퍼만 테스트 — mintOwnerSession은 통합 단계에서 실검증)
Run: `pnpm --filter server exec vitest run src/services/mkt/gate.service.test.ts`
Expected: PASS (isValidGateCode 4 케이스).

- [ ] **Step 5: Commit**
```bash
git add packages/server/src/services/mkt/gate.service.ts packages/server/src/services/mkt/gate.service.test.ts
git commit -m "feat(mkt-gate): 게이트 코드 검증(순수) + 소유자 세션 발급(magiclink, 비번 불필요)"
```

---

## Task 3: 게이트 컨트롤러 + 라우트

**Files:**
- Create: `packages/server/src/controllers/mkt/gate.controller.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1: 컨트롤러 작성** — `packages/server/src/controllers/mkt/gate.controller.ts` (기존 컨트롤러 패턴: asyncHandler + AppError):
```ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { config } from '../../config/index.js';
import { isValidGateCode, mintOwnerSession } from '../../services/mkt/gate.service.js';

/** POST /api/mkt/gate-login  Body: { code: string } → { success, data: {access_token, refresh_token} } */
export const gateLogin = asyncHandler(async (req: Request, res: Response) => {
  const code = (req.body?.code ?? '') as string;
  if (!isValidGateCode(code, config.mkt.gateCode)) {
    throw new AppError(401, '비밀번호가 올바르지 않습니다.');
  }
  const session = await mintOwnerSession();
  res.json({ success: true, data: session });
});
```
> 확인: `asyncHandler` 의 정확한 import 경로를 기존 컨트롤러(예: `controllers/mkt/keywords.controller.ts`)에서 그대로 따를 것. 다르면 그 경로 사용.

- [ ] **Step 2: 라우트 등록** — `packages/server/src/routes/mkt.routes.ts`:
import 블록에 추가:
```ts
import { gateLogin } from '../controllers/mkt/gate.controller.js';
```
라우트 추가(스토리지/AI 라우트 근처, 다른 `router.post` 들과 같은 스타일):
```ts
router.post('/gate-login', gateLogin);
```

- [ ] **Step 3: 타입체크 + 기존 서버 테스트 무회귀**
Run: `pnpm --filter server typecheck && pnpm --filter server test`
Expected: 타입 통과 + 기존 통과 테스트 유지(게이트 추가로 깨지는 것 없음). 새 gate.service 테스트 포함 그린.

- [ ] **Step 4: Commit**
```bash
git add packages/server/src/controllers/mkt/gate.controller.js packages/server/src/controllers/mkt/gate.controller.ts packages/server/src/routes/mkt.routes.ts
git commit -m "feat(mkt-gate): POST /api/mkt/gate-login 컨트롤러 + 라우트"
```
(`.js`는 없으면 무시 — `git add`가 존재하는 것만 스테이징.)

---

## Task 4: client 게이트 API + UI

**Files:**
- Create: `packages/client/src/features/marketing/api/gate.ts`
- Create: `packages/client/src/features/marketing/components/auth/MarketingGate.tsx`
- Modify: `packages/client/src/features/marketing/pages/MarketingLayout.tsx`

- [ ] **Step 1: api/gate.ts** — `packages/client/src/features/marketing/api/gate.ts`:
```ts
import { apiPost } from '@/lib/axios';
import { supabase } from './supabase';

/**
 * 게이트 코드(8054)를 서버에 보내 세션을 받고 supabase 세션으로 설정.
 * 성공 시 onAuthStateChange 가 발화되어 AuthContext 세션이 갱신된다.
 */
export async function gateLogin(code: string): Promise<void> {
  const { data } = await apiPost<{ access_token: string; refresh_token: string }>(
    '/api/mkt/gate-login',
    { code }
  );
  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) throw new Error(error.message);
}
```
> 확인: `apiPost` 의 정확한 시그니처/반환 형태를 `packages/client/src/lib/axios.ts`에서 확인하고, 서버 `{success, data}` 래핑을 벗기는 방식(기존 `*.api.ts` 패턴)에 맞출 것. 반환이 이미 `data`만 주면 위 `const { data } =`를 그에 맞게 조정.

- [ ] **Step 2: MarketingGate.tsx** — `packages/client/src/features/marketing/components/auth/MarketingGate.tsx`:
```tsx
import { useState } from 'react';
import { gateLogin } from '../../api/gate';

/** 마케팅 진입 게이트 — 비밀번호(8054)만 입력. 성공 시 세션이 설정되어 상위 가드가 통과시킴. */
export function MarketingGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await gateLogin(code.trim());
      // 성공 시 onAuthStateChange → AuthContext 세션 갱신 → 이 컴포넌트 언마운트.
    } catch {
      setError('비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-xs rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-bold text-gray-800">마케팅 스튜디오</h1>
        <p className="mb-6 text-sm text-gray-500">비밀번호를 입력하세요</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-widest focus:border-gray-500 focus:outline-none"
          placeholder="••••"
          aria-label="비밀번호"
        />
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? '확인 중…' : '입장'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: MarketingLayout 수정** — `packages/client/src/features/marketing/pages/MarketingLayout.tsx`의 no-session 분기를 게이트로 교체:
import 추가:
```tsx
import { MarketingGate } from '../components/auth/MarketingGate';
```
`if (!session) { return <Navigate to="/login" replace />; }` 를 다음으로 교체:
```tsx
  if (!session) {
    return <MarketingGate />;
  }
```
사용하지 않게 된 `import { Navigate } from 'react-router-dom';` 제거.

- [ ] **Step 4: 타입체크**
Run: `pnpm --filter client typecheck`
Expected: 통과.

- [ ] **Step 5: Commit**
```bash
git add packages/client/src/features/marketing/api/gate.ts packages/client/src/features/marketing/components/auth/MarketingGate.tsx packages/client/src/features/marketing/pages/MarketingLayout.tsx
git commit -m "feat(mkt-gate): 비밀번호 게이트 UI + MarketingLayout 가드 교체"
```

---

## Task 5: 통합 검증 (실 Supabase — 컨트롤러가 실행)

서버 게이트의 세션 발급(magiclink OTP)은 실 Supabase에서만 검증 가능. dev 서버 떠 있는 상태에서.

- [ ] **Step 1: 서버 재시작**(새 .env 반영) — 기존 dev 서버를 멈추고 다시 시작(preview_start 'dev').

- [ ] **Step 2: 게이트 엔드포인트 직접 호출 검증**
Run (Bash):
```bash
curl -s -X POST http://localhost:3500/api/mkt/gate-login -H 'Content-Type: application/json' -d '{"code":"8054"}' | head -c 400
```
Expected: `{"success":true,"data":{"access_token":"eyJ...","refresh_token":"..."}}`.
오답 코드 검증:
```bash
curl -s -X POST http://localhost:3500/api/mkt/gate-login -H 'Content-Type: application/json' -d '{"code":"0000"}' | head -c 200
```
Expected: 401 + `비밀번호가 올바르지 않습니다.`.
> 만약 verifyOtp가 `token_hash`/`magiclink` 조합에서 실패하면, `{ email, token: data.properties.email_otp, type: 'email' }` 조합으로 폴백 시도(서비스 코드 수정). 그래도 실패면 BLOCKED 보고(소유자 비번 기반 signInWithPassword로 설계 전환 필요).

- [ ] **Step 3: 브라우저 확인** — `http://localhost:5175/marketing` → 비밀번호 화면 → `8054` 입력 → 입장 → 콘텐츠 152개 로드 확인(세션이 RLS 통과). 새로고침해도 세션 유지(8054 재입력 불필요) 확인.

- [ ] **Step 4: (코드 수정이 있었다면) Commit**
```bash
git add -A packages/server/src/services/mkt/gate.service.ts
git commit -m "fix(mkt-gate): verifyOtp 조합 보정"
```

---

## Self-Review

- **Spec coverage:** 8054 비번 화면=Task 4(MarketingGate) / 서버 게이트(코드 검증→세션 발급)=Task 2·3 / 비번 클라이언트 미노출(service-role magiclink)=Task 2 mintOwnerSession / 세션 후 RLS 데이터 로드=Task 4 setSession + 기존 AuthContext / env(8054·owner·supabase)=Task 1 / 통합 검증=Task 5. 설계 전 항목 매핑됨.
- **Placeholder scan:** "apiPost 시그니처 확인"·"asyncHandler 경로 확인"·"verifyOtp 폴백"은 기존 코드 대조/런타임 보정 지시(실제 코드·명령 포함) — 모호 플레이스홀더 아님. TBD/TODO 없음.
- **Type consistency:** `isValidGateCode(input, expected)` · `mintOwnerSession(): {access_token, refresh_token}` · `gateLogin(code)` · 응답 `{success, data:{access_token, refresh_token}}` 가 Task 2·3·4에서 일관. 라우트 `/gate-login` ↔ client `/api/mkt/gate-login` 일치(`/api/mkt` prefix).
- **마이그레이션 0 / 보안:** DB 변경 없음. service-role·anonKey·비번은 서버 `.env`(gitignored)에만, 클라이언트 번들 미포함. 8054 약한 코드의 노출 위험은 설계서에 명시(내부용 전제).
