# 탱고북 마케팅 전략 자료

## 구성

```
docs/marketing/
├── strategy-2026-05-14.html  ← 메인 전략 문서 (브라우저로 열기)
├── data/
│   ├── naver-keywords-raw.json     # 네이버 API 원본 4,024개 키워드 데이터
│   └── naver-analyzed.json         # 카테고리화 + 골드 키워드 분석 결과
└── scripts/
    ├── naver-keyword-research.mjs  # 네이버 검색광고 API 호출
    └── analyze-naver-keywords.mjs  # 원본 → 분석 결과 변환
```

## 전략 문서 보기

`strategy-2026-05-14.html` 을 브라우저로 더블클릭. 단일 파일 (외부 의존성 없음).

## 키워드 데이터 갱신 방법

### 1) 네이버 API 자격증명 준비
[네이버 검색광고 API 콘솔](https://manage.searchad.naver.com/customers)에서 발급:
- API KEY (액세스 라이선스)
- SECRET KEY (비밀키)
- CUSTOMER ID

### 2) 시드 키워드 수정 (선택)
`scripts/naver-keyword-research.mjs` 의 `DIRECT_KEYWORDS`, `HINT_SEEDS` 배열 편집.

### 3) 실행
```bash
# Windows PowerShell
$env:NAVER_AD_API_KEY="..."
$env:NAVER_AD_SECRET_KEY="..."
$env:NAVER_AD_CUSTOMER_ID="..."
node docs/marketing/scripts/naver-keyword-research.mjs
node docs/marketing/scripts/analyze-naver-keywords.mjs

# Git Bash / macOS / Linux
NAVER_AD_API_KEY="..." NAVER_AD_SECRET_KEY="..." NAVER_AD_CUSTOMER_ID="..." \
  node docs/marketing/scripts/naver-keyword-research.mjs
node docs/marketing/scripts/analyze-naver-keywords.mjs
```

키워드 ~80개 기준 약 1~2분 소요. 결과는 `data/` 폴더에 저장.

## 주의

- API 자격증명은 절대 코드에 하드코딩하지 말 것. 환경변수로만 사용.
- `data/*.json` 은 갱신 시점의 스냅샷이므로, 시즈널 광고 결정 전엔 재실행 권장 (어린이날·크리스마스·신학기 전).
