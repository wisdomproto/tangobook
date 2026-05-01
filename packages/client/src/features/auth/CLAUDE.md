# Auth 모듈 (Supabase 로그인)

부모 계정 + 자녀 프로필 최대 4개 + PIN 4자리. Supabase Email/PW + Google OAuth.

## 핵심

- PIN 4자리 pgcrypto 해싱 (DB RPC `set_pin`/`verify_pin` SECURITY DEFINER, `set search_path` 강화)
- 15분 memoize + 3회 오답 시 60초 lockout (`useParentGate`)
- localStorage → `learning_events` 자동 마이그레이션 (플러그인 레지스트리 — 이후 스펙이 `MIGRATIONS[]`에 1줄 추가로 확장)
- 게스트 모드 호환: `isSupabaseConfigured=false`면 `ParentCornerButton` 숨김
- Edge Function: `supabase/functions/reset-pin/` (PIN 분실 magic link, rate-limited, enumeration-safe)

## 라우트

- `/login` (4-step state machine: auth → setPin → profile → done)
- `/login/callback`
- `/parent/*` (Reports placeholder · Profiles CRUD · Settings + ChangePinStep)

## Supabase 프로젝트

- `tangobook` (ref: `fxzwigjkbsptvsjraqwa`, ap-northeast-2)
- Dashboard: https://supabase.com/dashboard/project/fxzwigjkbsptvsjraqwa
- 스키마·RLS·RPC·트리거 배포 완료, `reset-pin` Edge Function v1 ACTIVE (verify_jwt=false)
- 클라 env: `packages/client/.env.local` (gitignore됨), 템플릿: `.env.local.example`

## 나중 작업

- Google OAuth provider 활성화
- Edge Function secret `PUBLIC_APP_URL` (PIN 분실 기능용)

상세: [memory/auth-login-complete.md](../../../../../memory/auth-login-complete.md), [memory/supabase-pending-todos.md](../../../../../memory/supabase-pending-todos.md)
스펙: [docs/superpowers/specs/2026-04-23-auth-login-design.md](../../../../../docs/superpowers/specs/2026-04-23-auth-login-design.md)
