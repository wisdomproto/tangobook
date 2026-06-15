# 동화책 → 마케팅 기본글 시딩 — Design

**Date:** 2026-06-15
**Status:** Draft (awaiting user review)
**Author:** Claude + kil210

## 배경 / 목표

탱고북의 "정규 콘텐츠" 단위는 동화책 1권이다. dflo(ContentFlow 원본)의 마케팅 콘텐츠 스튜디오처럼, 각 동화책마다 **기본글(base article)** 을 만들어 마케팅 도구(`/marketing`)에 채워 넣는다. 이 기본글은 이후 블로그·카드뉴스·릴스 생성의 컨텍스트 소스(gotcha (d) — `body_plain_text`)가 된다.

기본글은 단순 줄거리 요약이 아니라:
- (명작) 웹서치로 **원작**을 공부하고, 탱고북 각색본과 비교하고, 교훈과 "엄마가 아이에게 읽어주는 법"을 담는다.
- (자연관찰) 웹서치로 **자연·과학 사실**을 검증하고, 호기심 질문·관찰 확장 활동을 담는다.

대상: 명작동화 51권 + 자연관찰 101권 = **152권 전체**. 단, 먼저 **파일럿 6권**으로 포맷을 확정한 뒤 일괄 진행한다.

## 핵심 결정 (확정)

1. **파일럿 먼저** — 명작 3 + 자연관찰 3으로 포맷·깊이·톤 확정 후 나머지 146권 일괄.
2. **시드 스크립트(service-role)** — 기본글을 Supabase `mkt_base_articles` 에 멱등 upsert.
3. **카테고리별 2종 템플릿** — 명작 / 자연관찰 섹션 구성 분리.
4. **저작(authoring)과 시딩(seeding) 분리** — 기본글 내용은 git에 파일로, 시딩은 멱등 스크립트.

## 데이터 소스

- 동화책 본문: `packages/server/scripts/_data/translations/vi/<id>.json` (152개, 로컬 보유).
  - 키: `id`, `title`(한글), `titleT`(번역), `pages[].ko`(전체 한글 본문), `keyObjects`, `parentGuide`.
- **카테고리 분류기**: 페이지 수. `pages.length <= 17` → `classic`(명작 51: 15p×50 + 17p×1=오즈의 마법사), `>= 18` → `nature`(자연관찰 101: 18p×81 + 19p×20=공룡). 152권 전수 검증으로 명작 51 / 자연 101 = CLAUDE.md 수치와 정확히 일치 확인.

## 데이터 흐름

```
[저작: Claude]                                  [시딩: 1회 실행]
translations/vi/<id>.json (ko 본문)              seed-marketing-base-articles.mjs
  + 웹서치(명작 원작 / 자연 과학 사실)       →    ├─ env: SUPABASE_URL + SERVICE_ROLE_KEY
  → _data/marketing/base-articles/<id>.json       ├─ 소유자 user_id 해석 (--owner-email)
     {storybookId, category, title,                ├─ "탱고북 동화책" mkt_project ensure
      body_html, body_plain_text, sources}         ├─ book마다 mkt_contents upsert
                                                    └─ mkt_base_articles upsert (idempotent)
```

**왜 분리하나:** 기본글 내용은 git 파일로 남아 리뷰·재생성·버전관리가 되고, 시딩은 멱등(upsert)이라 반복 실행이 안전하다. 파일럿 → 일괄 전환도 동일 스크립트로 처리한다.

## 산출물 파일 포맷

경로: `packages/server/scripts/_data/marketing/base-articles/<storybookId>.json`

```json
{
  "storybookId": "1772510956605",
  "category": "classic",
  "title": "잭과 콩나무",
  "body_html": "<h2>작품 소개</h2><p>...</p>...",
  "body_plain_text": "작품 소개\n...",
  "sources": ["https://..."],
  "generatedAt": "2026-06-15"
}
```

- `body_html` → `mkt_base_articles.body` (TipTap HTML).
- `body_plain_text` → `mkt_base_articles.body_plain_text` (다운스트림 생성 컨텍스트).
- `word_count` 는 시드 스크립트가 plain text 기준으로 계산해 채운다.

## 카테고리별 2종 템플릿

### 명작동화 (classic)
1. **작품 소개** — 한 줄 후킹 + 핵심 가치
2. **원작 이야기** (웹서치) — 유래·작가/민담 출처·시대/나라·원작의 결말
3. **탱고북 각색 비교** — 원작 대비 같은 점 / 바꾼 점 (우리 `pages[].ko` 기반)
4. **줄거리 요약**
5. **이 동화가 주는 교훈·가치**
6. **부모 가이드 — 아이에게 읽어주는 법** (`parentGuide` 활용 + 발문 예시)
7. **함께 나눌 질문 / 확장 활동**
8. **추천 연령 · 읽기 포인트**

### 자연관찰 (nature)
1. **주제 소개** — 다루는 동물/식물/자연 현상 + 후킹
2. **자연·과학 사실 검증** (웹서치) — 정확한 생태/과학 사실
3. **탱고북에서 다루는 내용** (우리 `pages[].ko` 기반)
4. **핵심 어휘** (`keyObjects` 활용)
5. **아이의 호기심을 여는 질문**
6. **부모 가이드 — 관찰·체험으로 확장하는 법**
7. **함께 할 수 있는 활동**
8. **추천 연령**

## 시드 스크립트

경로: `packages/server/scripts/seed-marketing-base-articles.mjs`

- deps: `@supabase/supabase-js` (server에 이미 존재).
- env: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (없으면 명확한 에러로 즉시 중단; 로컬 .env 미설정 시 사용자가 실행 시 주입).
- 플래그:
  - `--owner-email <email>` (기본 `kil210@tangobook.co.kr`) → `auth.users` 조회로 `user_id` 해석. 단일 유저면 자동 선택.
  - `--ids a,b,c` (파일럿) 또는 `--all` (일괄).
  - `--dry-run` (DB 쓰기 없이 계획만 출력).
- 동작:
  1. `mkt_projects` 에서 name="탱고북 동화책" + 해당 user 소유 row 조회, 없으면 생성.
  2. 각 base-article JSON 마다:
     - `mkt_contents` upsert — title=책 제목, topic=책 제목, status='draft'. **content_id 안정화**: `storybookId` 로부터 결정적 id 생성(재실행 시 중복 방지). 기존 row는 storybook 매핑 컬럼으로 조회.
     - `mkt_base_articles` upsert — `useUpsertBaseArticle` 와 동일한 select-then-insert/update 패턴 (`content_id` 기준). `user_id` 스탬프 필수.
  - 모든 insert에 `user_id` 스탬프 (RLS `with check` 통과).

### content_id ↔ storybook 매핑

`mkt_contents` 에 storybook 식별자를 보관할 컬럼이 필요. 기존 스키마에 적당한 컬럼(`topic` 또는 `description`)이 있으면 재사용, 없으면 결정적 id 규칙(`storybookId` 해시)으로 row를 식별한다. **구현 플랜에서 `mkt_contents` 실제 컬럼을 확인 후 확정** — 마이그레이션 없이 기존 컬럼으로 해결하는 것을 우선.

## 파일럿 6권 (확정)

| 카테고리 | 제목 | id | 비고 |
|---|---|---|---|
| classic | 잭과 콩나무 | 1772510956605 | 영국 민담 |
| classic | 신데렐라 | 1772107608499 | 페로/그림 |
| classic | 미운 아기 오리 | 1772093674655 | 안데르센 |
| nature | 펭귄 | 1777612659016 | 동물 |
| nature | 해바라기 | 1773365203383 | 식물 |
| nature | 화산과 지진 | 1773615711742 | 지구과학 |

## 진행 순서

1. **파일럿**: 6권 base-article JSON 저작(웹서치 포함) + 시드 스크립트 작성.
2. 사용자가 파일 리뷰 + `--ids`로 시드 실행해 마케팅 도구에서 확인.
3. **일괄**: 나머지 146권 동일 템플릿으로 저작 후 `--all` 시드.

## 테스트 / 검증

- 시드 스크립트의 순수 헬퍼(word_count 계산, content_id 결정 규칙, plain-text 추출)는 단위 테스트.
- `--dry-run` 으로 DB 쓰기 전 계획 검증.
- 실제 시딩 후 사용자가 `/marketing` 에서 기본글 노출 육안 확인.

## 미해결 / 가정

- **시딩 실행 환경**: 실제 Supabase 크레덴셜은 사용자가 실행 시 제공(로컬 `.env` 채우거나 환경변수 주입). 로컬 체크아웃엔 placeholder만 존재.
- **`mkt_contents` storybook 매핑 컬럼**: 구현 시 실제 스키마 확인 후 마이그레이션 없이 기존 컬럼으로 해결 우선.
- 기본글은 한국어로 작성. 다국어 번역은 범위 밖(기존 번역 파이프라인 별도).
