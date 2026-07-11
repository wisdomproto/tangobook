---
description: 새 언어 추가 원버튼 — 콘텐츠 번역(149권) + UI 로케일 + SEO(hreflang·sitemap) 전체 파이프라인 실행
argument-hint: <언어코드 예: ja> [--ui-only|--content-only]
---

# /add-language $ARGUMENTS — 언어 추가 파이프라인

인자로 받은 언어 코드(`$ARGUMENTS`, 예: `ja`)를 탱고북에 추가한다.
**설계 원칙: 아래 데이터만 채우면 언어 토글·hreflang·sitemap·SSR 이 전부 자동 derive 된다 (코드 변경 0).**

## 0. 사전 확인
1. `packages/shared/src/constants/index.ts` 의 `SUPPORTED_LANGUAGES` 에 해당 코드가 있는지 확인. 없으면 `{ code, label(한국어명), nativeName, flag }` 한 줄 추가 후 `pnpm --filter shared build`.
2. `packages/shared/src/constants/seo-i18n.ts` 에 `SEO_STRINGS[<lang>]` 항목이 있는지 확인. 없으면 en 항목을 참조해 해당 언어로 작성 (12개 라벨 — Claude 직접 작성).
3. 로컬 dev 서버 불필요 (extract/apply 는 R2 직접 접근 — `packages/server/.env` 필요).

## 1. 콘텐츠 번역 (--ui-only 면 스킵)
```bash
node packages/server/scripts/translate-extract.mjs --lang=<code> --category=all
```
→ `packages/server/scripts/_data/translations/<code>/` 에 책별 JSON 생성 (기존 번역 보존).

**배치 번역 (서브에이전트 병렬)**:
- 파일 목록을 12권 단위로 나눠 배치 매니페스트 작성 (스크래치패드에 `tr-<lang>-batch-N.txt`).
- general-purpose 서브에이전트를 **동시 최대 6개**로 투입 (⚠️ 8개+ 는 rate limit — vi/zh/th 실측). 완료되는 대로 다음 배치 투입.
- 에이전트 지시 핵심: 빈 `t`/`titleT`/`q_t`/`a_t` 만 채움 · ko 원문 기준 + en 교차 참고 · `**볼드**`·`\n` 보존 · 4~7세 구어체 + 부모 가이드는 존중체 · 고유명사 현지 통용 표기 · 빈 ko placeholder 는 t 도 빈 값 · 저장 후 JSON 파싱 검증 · 보고는 "완료 N권" 한 줄만.
- 이전 실행 프롬프트 원본: memory `i18n-system-2026-07-11` 참조.

**적용 + 검증**:
```bash
node packages/server/scripts/translate-apply.mjs --lang=<code> --dry-run   # 빈 t 검증
node packages/server/scripts/translate-apply.mjs --lang=<code>            # R2 주입
node packages/server/scripts/translate-verify.mjs --lang=<code> <표본 id>
```
apply 가 `languages[]`·`titleTranslations`·`page.translations`·`nameTranslations`·`parentGuideTranslations` 를 채움 → **이 순간부터 hreflang·sitemap·SSR about 페이지가 자동 활성화**.

## 2. UI 로케일 (--content-only 면 스킵)
- `packages/client/src/i18n/locales/ko/*.json` 이 원문 SSOT.
- 서브에이전트로 `locales/<code>/` 에 동일 파일명·동일 키 구조로 번역 생성 (네임스페이스별 파일 분할, `{{보간}}`·이모지 보존, 유아 서비스 톤).
- 검증: `node packages/client/scripts/verify-locales.mjs` (ko 대비 키 누락/여분 체크 — 없으면 키 diff 를 python 으로).

## 3. 허브 페이지 카피 (선택 — 콘텐츠 언어만)
`packages/shared/src/constants/seo-i18n.ts` 의 `HUB_STRINGS[<lang>]` 에 classics/nature 카피 작성 → 해당 언어 `/lang/guide/*` 허브 자동 활성화 (sitemap 포함).

## 4. 마무리 (신간 SEO 절차와 동일)
```bash
pnpm --filter shared build && pnpm typecheck
pnpm --filter server sitemap        # 언어별 URL 자동 포함 확인
git add ... && git commit && git push   # 배포
# 배포 후:
pnpm --filter server indexnow       # 책 URL push (언어 URL 은 --url 로 표본)
```
- 라이브 검증: `curl https://www.tangobook.co.kr/<code>/library/<표본id>/about | grep '<title>'` — 번역 제목 확인 + hreflang 존재 확인.

## 주의
- **TTS 는 별도** (텍스트만 — 나레이션은 gemini TTS 배치, 트래픽 검증 후).
- 표지 이미지는 `lang→en→ko` 폴백이라 별도 작업 불필요.
- `--force` 없이 extract 는 기존 번역 보존 (멱등).
- zh 는 간체(简体) 고정.
