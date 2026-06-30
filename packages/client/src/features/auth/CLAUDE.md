# Auth 모듈 (Supabase 로그인)

부모 계정 + 자녀 프로필 최대 4개 + PIN 4자리. Supabase Email/PW + **소셜 로그인(카카오·구글)**.

## 핵심

- PIN 4자리 pgcrypto 해싱 (DB RPC `set_pin`/`verify_pin` SECURITY DEFINER, `set search_path` 강화)
- 15분 memoize + 3회 오답 시 60초 lockout (`useParentGate`)
- localStorage → `learning_events` 자동 마이그레이션 (플러그인 레지스트리 — 이후 스펙이 `MIGRATIONS[]`에 1줄 추가로 확장)
- 게스트 모드 호환: `isSupabaseConfigured=false`면 `ParentCornerButton` 숨김
- Edge Function: `supabase/functions/reset-pin/` (PIN 분실 magic link, rate-limited, enumeration-safe)

## 소셜 로그인 (카카오·구글, 2026-06-30 라이브)

- `authApi.signInWithKakao()` / `signInWithGoogle()` = Supabase 네이티브 OAuth provider 위임. 복귀는 `/login/callback` 에서 `detectSessionInUrl` 자동 처리 → LoginPage 상태머신 합류. `email` 은 `string|null` 이라 이메일 미제공도 안전.
- 공용 버튼 `components/SocialAuthButtons.tsx` (`mode: 'signin'|'signup'`) — 카카오 공식 노란 버튼(`#FEE500`) + 구글 공식 버튼, 인라인 SVG 로고. SignInForm/SignUpForm 둘 다 소셜 우선 레이아웃(상단 소셜 → "또는 이메일로" 구분선 → 이메일/PW).
- ⚠️ **카카오 비즈앱 필수**: Supabase 카카오는 `account_email,profile_image,profile_nickname` 3 scope 를 항상 요청(클라 `scopes` 로 못 뺌 — 더해질 뿐). 미설정 시 **KOE205**. → 카카오 콘솔 **동의항목** 3개 모두 "사용 안 함" 아니게 설정해야 하고, `account_email` 은 **비즈앱 전환**(개인 개발자도 본인인증+카카오비즈니스 약관동의로 가능, 사업자번호 불필요)해야 켜짐. 구글은 OAuth 동의화면 "테스트 중" → 테스트 사용자에 로그인 계정 등록 필요.
- 콘솔 설정 가이드: [docs/auth/social-login-setup.md](../../../../../docs/auth/social-login-setup.md)
- 🟡 미해결(보류): OAuth 동의화면에 `fxzwigjkbsptvsjraqwa.supabase.co` 노출 → Supabase **Custom Domain**($10/월) 으로만 우리 도메인 표시 가능. 비용 이슈로 보류.

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

- ~~Google OAuth provider 활성화~~ ✅ (카카오·구글 둘 다 라이브, 2026-06-30)
- Edge Function secret `PUBLIC_APP_URL` (PIN 분실 기능용)
- (보류) Supabase Custom Domain — OAuth 화면 도메인 브랜딩

상세: [memory/auth-login-complete.md](../../../../../memory/auth-login-complete.md), [memory/supabase-pending-todos.md](../../../../../memory/supabase-pending-todos.md)
스펙: [docs/superpowers/specs/2026-04-23-auth-login-design.md](../../../../../docs/superpowers/specs/2026-04-23-auth-login-design.md)
