# 동화책 다국어 키워드 전략 (Google/DataForSEO) — Design

**Date:** 2026-06-15
**Status:** Draft (awaiting user review)
**Author:** Claude + kil210

## 배경 / 목표

동화책 152권(명작 51 + 자연관찰 101)을 대상으로, 다국어 SEO 블로그가 타깃할 키워드를 **Google 검색량(DataForSEO) 근거**로 선정한다. 이 단계의 산출물(키워드 플랜)은 **다음 sub-project(블로그 생성)** 가 소비한다.

본 spec은 **"키워드 전략" 단계만** 다룬다. 블로그 생성은 별도 spec.

대상 언어: **ko · en · vi · th** (4개). 각 콘텐츠 × 각 언어마다 **primary 1 + secondary 3~5** 키워드를 선정한다.

## 핵심 결정 (확정)

1. **2단계 분리** — ① 키워드 전략(이 spec) → ② 블로그 생성(다음 spec).
2. **대상 언어 ko·en·vi·th**.
3. **DataForSEO 실데이터** — 기존 `/api/mkt/google/keywords` 엔드포인트(`{keywords, locationCode, languageCode}`) 재사용. 크레덴셜은 `packages/server/.env`(gitignored).
4. **후보 생성 = Claude 시드 → DataForSEO 검증 → 규칙 선정** (DataForSEO 자동추천 의존 X).
5. **산출물 = git 파일** (키워드 플랜). 이 단계 DB 적재 0 — 블로그 생성 시 `mkt_blog_contents.primary_keyword/secondary_keywords`에 기록.
6. **파일럿 먼저** (6권 × 4언어) → 승인 후 전체 152.

## 언어 / DataForSEO 코드

| 언어 | language_code | 타깃 국가 | location_code(확정 대상) |
|---|---|---|---|
| 한국어 ko | ko | 대한민국 | 2410 |
| 영어 en | en | 미국(US) | 2840 |
| 베트남어 vi | vi | 베트남 | 2704 |
| 태국어 th | th | 태국 | 2764 |

> location_code 값은 구현 시 DataForSEO Locations API로 확정. 1콜당 키워드 상한·과금도 확인.

### 태국어(th) 단서
- 동화책 콘텐츠는 ko(원문)·en·vi만 번역 보유. **th 번역 없음.**
- 키워드 전략 단계는 th 가능 — **제목을 태국어로 옮겨**(예: Cinderella → ซินเดอเรลล่า) 후보 키워드를 만들고 DataForSEO(태국)로 검색량 조회.
- **th 블로그 생성은 별도 태국어 콘텐츠/번역 필요** → 다음 spec에서 다룸(이번 범위 밖).

## 데이터 소스
- 콘텐츠 메타: `packages/server/scripts/_data/translations/vi/<id>.json` — `title`(ko), `titleT`/`en`(영문 제목·본문), `pages`, `keyObjects`, 카테고리는 페이지 수로 분류(≤17 classic / ≥18 nature).
- 기본글(맥락): `_data/marketing/base-articles/<id>.json`(152, 기존).

## 데이터 흐름

```
① 메인(헤드) 키워드 풀           ② 콘텐츠 후보 키워드               ③ DataForSEO 검색량        ④ 선정        ⑤ 산출물(파일)
언어별 큐레이션 시드        +    콘텐츠별 제목+변형 생성       →    언어×국가 배치 조회     →   규칙+판단  →  keyword-plans/<id>.json
(동화책/4세 동화책/명작/          (신데렐라 동화/줄거리/교훈,         (search_volume·              primary +    + _main-keywords.json
 자연관찰책 …)                    Cinderella story for kids …)       competition·cpc)            secondary
```

1. **메인(헤드) 키워드 풀** — 콘텐츠 공통 카테고리·연령·용도 축. 언어별 큐레이션 시드(ko: 동화책·유아 동화책·4세 동화책·그림책·명작 동화·자연관찰 책·잠자리 동화 등 / en: fairy tale books for kids·bedtime stories for toddlers·classic fairy tales·preschool books 등 / vi·th 대응). DataForSEO 1회 조회 → 검색량 표 → `_main-keywords.json`.
2. **콘텐츠 후보 키워드** — 콘텐츠마다 제목+변형 생성. 명작=작품명 축(작품명 단독·+동화/이야기/줄거리/교훈·+연령·롱테일 질문형), 자연관찰=동물/주제명 축(주제명 단독·+관찰/특징·+아이/유아·질문형). 언어별로 그 언어의 제목·표현 사용.
3. **DataForSEO 검색량 조회** — 언어×국가별 배치 호출. 후보+메인 키워드의 `search_volume·competition·cpc`.
4. **선정** — 콘텐츠×언어별 primary 1(관련성 높고 검색량 있는 키워드) + secondary 3~5(보조·롱테일·메인키워드 조합). 검색량 0/극저 또는 무관 후보는 제외. 규칙 우선 + 동점 시 판단.
5. **산출물** — 파일.

## 산출물 포맷

`packages/server/scripts/_data/marketing/keyword-plans/<storybookId>.json`:
```json
{
  "storybookId": "1772107608499",
  "category": "classic",
  "titleKo": "신데렐라",
  "plans": {
    "ko": {
      "primary": "신데렐라 동화",
      "secondary": ["신데렐라 줄거리", "신데렐라 교훈", "신데렐라 그림책", "유아 명작 동화"],
      "candidates": [{ "keyword": "신데렐라 동화", "searchVolume": 1300, "competition": 0.21, "cpc": 0.12 }]
    },
    "en": { "primary": "...", "secondary": ["..."], "candidates": [] },
    "vi": { "...": "..." },
    "th": { "...": "..." }
  },
  "generatedAt": "2026-06-15"
}
```
글로벌: `_data/marketing/keyword-plans/_main-keywords.json` — `{ ko: [{keyword, searchVolume, competition, cpc}], en: [...], vi: [...], th: [...] }`.

## 컴포넌트 (작은 단위 + TDD)

- `scripts/lib/keyword-candidates.mjs` — 순수. `(titleByLang, category, lang) → 후보 키워드[]`. 언어별 변형 규칙(명작/자연 분기).
- `scripts/lib/keyword-select.mjs` — 순수. `(candidatesWithVolume) → {primary, secondary[]}` (관련성·검색량 규칙).
- `scripts/lib/keyword-plan-helpers.test.mjs` — 위 두 모듈 단위 테스트.
- DataForSEO 조회: 기존 서버 `external/dataforseo.ts`(google volume) 재사용. 스크립트는 같은 로직을 직접 호출하거나 서버 경유. (구현 시 결정 — 스크립트 단독 실행 위해 `getKeywordVolumes(keywords, locationCode, languageCode)` 직접 호출 권장.)
- `scripts/research-keyword-plans.mjs` — 오케스트레이터. `--ids a,b / --all`, `--langs ko,en,vi,th`, `--dry-run`. DataForSEO 크레덴셜 env 로드(`packages/server/.env`). 후보 생성 → 배치 볼륨 조회 → 선정 → 파일 작성. 메인 키워드 풀도 생성.
- `scripts/validate-keyword-plans.test.mjs` — 산출물 스키마/정합성 검증(필수 키, 언어 4개, primary 존재 등).
- **다국어 제목**: en 제목은 소스 `en`/`titleT`에서, vi 제목은 `titleT`(vi)에서. th 제목은 후보 생성기가 보유한 매핑(작품명·동물명 태국어)에서. 매핑은 산출물과 함께 git 보존.

## 진행 순서

1. **파일럿**: 6권(명작 3 + 자연 3) × ko·en·vi·th → 후보 생성·볼륨 조회·선정·파일 작성 + 메인 키워드 풀. 포맷·규칙 검증.
2. 사용자 검토 후 **전체 152** 실행.

## 테스트 / 검증
- 순수 헬퍼(후보 생성·선정) 단위 테스트.
- `--dry-run`: DataForSEO 호출 없이 후보 생성·계획만 출력.
- 산출물 검증 테스트로 152 파일 스키마 게이트.
- 실조회 후 검색량 표를 사람이 1차 점검(명백히 무관한 primary 없는지).

## 미해결 / 가정
- DataForSEO **location_code 정확값**(KR/US/VN/TH) + 1콜 키워드 상한 + 과금 — 구현 시 확정.
- DataForSEO 실조회는 크레덴셜로 사용자/내가 실행(이미 `.env` 저장).
- en 타깃 = 미국(US). vi=베트남, th=태국, ko=대한민국.
- th 콘텐츠 부재 → 키워드 전략만, 블로그 생성은 다음 spec.
- 키워드 플랜은 파일(git). DB 적재는 블로그 생성 단계.
