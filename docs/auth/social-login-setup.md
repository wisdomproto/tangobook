# 소셜 로그인(카카오·구글) 콘솔 설정 가이드

탱고북 로그인은 Supabase 네이티브 OAuth provider 로 카카오/구글을 처리한다.
**코드는 배포 완료** 상태이고, 아래 콘솔 설정만 끝나면 버튼이 동작한다.

> 모든 콘솔에 공통으로 들어가는 값
> **Supabase Redirect URI** = `https://fxzwigjkbsptvsjraqwa.supabase.co/auth/v1/callback`

복사해 둘 키 4개: ① 카카오 REST API 키 · ② 카카오 Client Secret · ③ 구글 Client ID · ④ 구글 Client Secret

---

## 1. 카카오 — https://developers.kakao.com

1. 로그인 → **내 애플리케이션 → 애플리케이션 추가하기** (앱 이름: `탱고북`, 사업자명 입력)
2. **앱 키** → **REST API 키** 복사 → **①**
3. **카카오 로그인** → 상단 토글 **활성화 ON**
4. 같은 화면 **Redirect URI 등록** → 위 Supabase Redirect URI 붙여넣기
5. **보안** → **Client Secret** 코드 생성 + **활성화 ON** → 복사 → **②**
6. **앱 설정 → 플랫폼** → **Web 플랫폼 등록** → 사이트 도메인 `http://localhost:5174`
   (운영 추가 시 `https://tangobook.co.kr` 도 등록)
7. **카카오 로그인 → 동의항목** — ⚠️ **3개 모두** "사용 안 함"이 아니어야 한다.
   Supabase 카카오는 `account_email`,`profile_image`,`profile_nickname` 를 **항상 요청**하며
   클라 코드로 scope 를 줄일 수 없다(더해질 뿐). 하나라도 미설정이면 **KOE205** 에러.
   - `닉네임(profile_nickname)` → **필수 동의**
   - `프로필 사진(profile_image)` → **선택 동의**
   - `카카오계정(이메일)(account_email)` → **필수 동의** — 단, **비즈앱 전환** 필요(아래).

### 카카오 비즈앱 전환 (account_email 활성화 필수)

비전환 상태면 `account_email` 이 "권한 없음"이라 켤 수 없어 KOE205 가 영구 발생한다.
**개인 개발자도 사업자번호 없이** 전환 가능:
1. 앱 설정 → 일반 → "개인 개발자 비즈 앱" → **카카오비즈니스 통합 서비스 약관 동의** (본인인증)
2. "개인 개발자 비즈 앱 전환" 모달 → 전환 목적 `이메일 필수 동의` → **저장**
3. 전환되면 동의항목의 `account_email` 에 「설정」 버튼이 생김 → 필수 동의로 설정

## 2. 구글 — https://console.cloud.google.com

1. 상단 프로젝트 선택 → **새 프로젝트** (이름: `tangobook`)
2. **API 및 서비스 → OAuth 동의 화면**(최신 UI: Google 인증 플랫폼) → **외부(External)** → 앱 이름/지원 이메일만 채우고 저장
3. **사용자 인증 정보(클라이언트) → OAuth 클라이언트 ID → 웹 애플리케이션**
4. **승인된 리디렉션 URI** → 위 Supabase Redirect URI 붙여넣기 → **만들기**
5. 팝업의 **클라이언트 ID → ③**, **클라이언트 보안 비밀 → ④** 복사
6. **대상(Audience)** → 게시 상태 "테스트 중"이면 **테스트 사용자**에 로그인할 구글 계정 추가
   (안 하면 "앱이 확인되지 않음 / 액세스 차단")

## 3. Supabase 대시보드

[Authentication → Providers](https://supabase.com/dashboard/project/fxzwigjkbsptvsjraqwa/auth/providers)

1. **Kakao** 펼치기 → Enable → **REST API Key = ①**, **Client Secret = ②** 입력 → **Save**
2. **Google** 펼치기 → Enable → **Client ID = ③**, **Client Secret = ④** 입력 → **Save**
3. 좌측 **URL Configuration**:
   - **Site URL** = `https://tangobook.co.kr` (도메인만, 경로 X — 이메일 링크 베이스로도 쓰임)
   - **Redirect URLs**: `http://localhost:5174/login/callback` + `https://tangobook.co.kr/login/callback`

> 🟡 **알려진 한계**: OAuth 동의 화면에 `fxzwigjkbsptvsjraqwa.supabase.co` 가 표시됨(로그인은 정상,
> 브랜딩만). 우리 도메인(`auth.tangobook.co.kr`)으로 바꾸려면 Supabase **Custom Domain** 애드온
> ($10/월) 필요 → 콘솔 Redirect URI 도 새 도메인으로 교체해야 함. 현재 비용 이슈로 보류.

---

## 동작 확인

`pnpm dev` 후 `http://localhost:5174/login` →
- **카카오로 로그인** 클릭 → 카카오 동의 화면 → 복귀 → PIN 설정 단계로 진입
- **Google로 로그인** 클릭 → 구글 동의 화면 → 복귀 → PIN 설정 단계로 진입

흐름: OAuth 복귀(`/login/callback`)는 `detectSessionInUrl` 이 자동 세션화하고,
`LoginPage` 상태머신(auth → setPin → profile → done)이 이어받는다.

## 코드 위치

- `features/auth/api/auth.api.ts` — `signInWithKakao` / `signInWithGoogle`
- `features/auth/components/SocialAuthButtons.tsx` — 공용 버튼(카카오/구글)
- `SignInForm.tsx` / `SignUpForm.tsx` — 소셜 우선 레이아웃
