# 탱고북 마케팅 전략 자료

## 구성

```
docs/marketing/
├── strategy-2026-05-14.html             ← 최초 SEO 전략 (네이버 카테고리 키워드 분석)
├── data/                                ── 실측 키워드 + 통합 분석 데이터
│   ├── naver-keywords-raw.json          ── 네이버 API 원본 (카테고리 시드, 4,024개)
│   ├── naver-analyzed.json              ── 카테고리화 + 골든 분석
│   ├── naver-content-raw.json           ── 네이버 콘텐츠 시드 (백설·공룡·곤충 등 200+ 시드 → 22,289개)
│   ├── naver-discovered-bonus.json      ── 시드 외 발견된 관련 키워드 (20,602개, 후속 마이닝용)
│   ├── dataforseo-kr.json               ── Google Ads KR (location 2410, lang ko)
│   ├── dataforseo-en.json               ── Google Ads US (location 2840, lang en)
│   ├── consolidated-keywords.json       ── 4개 소스 통합 (Naver 카테고리 + 콘텐츠 + Google KR + EN)
│   ├── consolidated-summary.md          ── 사람용 요약 (교차검증·골든·카테고리)
│   └── audit-report.md                  ── 노이즈 감사 + 발견 보너스 마이닝 결과
└── scripts/                             ── 키워드 리서치 자동화 + 통합 + 시각화
    ├── content-seeds.mjs                ── 시드 공유 모듈 (KR/EN × 13 카테고리, 단일 진실원천)
    ├── naver-keyword-research.mjs       ── 네이버 API 호출 (카테고리 시드)
    ├── analyze-naver-keywords.mjs       ── 네이버 원본 → 분석 결과
    ├── naver-content-keyword-research.mjs ── 네이버 API (콘텐츠 시드, rate-limit + retry)
    ├── dataforseo-keyword-research.mjs  ── DataForSEO Google Ads (KR + EN)
    ├── consolidate-keywords.mjs         ── 4개 소스 머지 + 골든·메인 분류
    ├── audit-noise-and-mine.mjs         ── 노이즈 감사(A) + 보너스 마이닝(C)
    └── generate-seo-html.mjs            ── consolidated → packages/client/public/seo-strategy.html
```

## 자료실(저작도구 TopBar)에 등록된 마케팅 문서 3종

| 항목 | 경로 | 용도 |
|---|---|---|
| 🔍 SEO 전략 | `packages/client/public/seo-strategy.html` | 콘텐츠 단위 키워드·골든·교차검증·6개월 로드맵 (자동 생성) |
| 🎯 운영 플레이북 | `packages/client/public/operations-playbook.html` | 본질 베타 → 점진 확장 + 비즈니스 모델 + 8-Pronged 알림 + 듀얼 블로그 + 포인트 |
| 🚀 바이럴 자석 UI | `packages/client/public/viral-magnets-wireframes.html` | 5종 자석 모바일 와이어프레임 (디자인·개발 발주서) |

## 키워드 데이터 갱신 방법

### 1) API 자격증명 준비
- 네이버 검색광고: API KEY + SECRET KEY + CUSTOMER ID
- DataForSEO: LOGIN + PASSWORD

### 2) 시드 키워드 편집 (선택)
모든 콘텐츠 단위 시드는 `scripts/content-seeds.mjs` 한 곳에서 관리. 13 카테고리 × KR/EN.

### 3) 실행 파이프라인 (전체 갱신 시)

```bash
# 1. 네이버 콘텐츠 시드 호출 (rate-limit 약 2분)
NAVER_AD_API_KEY="..." NAVER_AD_SECRET_KEY="..." NAVER_AD_CUSTOMER_ID="..." \
  node docs/marketing/scripts/naver-content-keyword-research.mjs

# 2. DataForSEO Google Ads (KR + EN, 약 30초)
DATAFORSEO_LOGIN="..." DATAFORSEO_PASSWORD="..." \
  node docs/marketing/scripts/dataforseo-keyword-research.mjs

# 3. 4개 소스 통합 분석
node docs/marketing/scripts/consolidate-keywords.mjs

# 4. (선택) 노이즈 감사 + 보너스 마이닝
node docs/marketing/scripts/audit-noise-and-mine.mjs

# 5. SEO 전략 HTML 재빌드
node docs/marketing/scripts/generate-seo-html.mjs
```

시즈널 광고 결정 전(어린이날·크리스마스·신학기) 재실행 권장.

## 핵심 분석 결과

- **콘텐츠 단위 시드가 진짜 광맥** — 카테고리 시드 최대 8,120/높음 vs 콘텐츠 시드 최대 90,500/낮음 (11배 트래픽 × 경쟁 1/3)
- **명작 동화 카테고리 SEO 최강** — 보물섬 47k LOW, 작은아씨들 20k, 어린왕자 18k, 강아지똥 18k LOW
- **글로벌(US)** — dinosaur 1M, wizard of oz 450k, snow white 673k 모두 LOW
- **알라딘·알리바바 제외** — 중고서적·전자상거래 의도로 점령됨
- **Naver vs Google 경쟁도 다름** — 같은 키워드 Naver HIGH/Google LOW 다수. 광고 결정은 Naver 기준 보수적

## 주의

- API 자격증명은 절대 하드코딩 X. 환경변수만.
- `data/*.json` 은 갱신 시점 스냅샷.
- `naver-content-raw.json` 의 raw keywords 는 시드 외 발견된 관련 키워드를 다수 포함 — 마이닝 시 노이즈 필터 필요 (`audit-noise-and-mine.mjs` 참조).
