# 동화책 SEO 블로그(내부블로그) 저작 가이드 — 배치 에이전트용

각 동화책마다 한국어 SEO 블로그를 작성해 `packages/server/scripts/_data/marketing/blogs/<storybookId>.json` 으로 저장한다. 도구의 InternalBlogPanel(Google/GEO 내부블로그)에 그대로 뜬다.

## 작업 절차 (책 1권당)

1. **소스 읽기** — 이미 시딩된 기본글에 핵심 내용이 다 있다:
   `packages/server/scripts/_data/marketing/base-articles/<id>.json` 의 `body_plain_text`(명작=원작/각색/교훈/부모가이드 / 자연=사실/어휘/활동). 이걸 SEO 블로그로 재구성한다.
2. **키워드 근거** — `docs/marketing/data/consolidated-keywords.json` 의 `KR.byCategory[*].top5` 또는 `KR.golden` 에서 그 동화책 주제어(예: 신데렐라, 해바라기)의 `naverVolume`/`googleVolume` 확인. primary 키워드는 그 주제어 기반.
3. **블로그 작성** — 아래 스키마. 한국어, 학부모 검색 대상. GEO(생성형 검색) 최적화 = FAQ 필수.
4. **파일 저장** — node 에서 객체를 만들어 `JSON.stringify` 로 써서 이스케이프 정확히.

## 출력 스키마 (정확히 이 형태)

```json
{
  "storybookId": "<id>",
  "seo_title": "<주제어 포함, 60자 내외, 예: '신데렐라 동화 줄거리와 교훈 — 아이에게 읽어주는 법'>",
  "primary_keyword": "<주제어 또는 +동화, 예: '신데렐라 동화'>",
  "secondary_keywords": ["<주제어+줄거리>", "<+교훈>", "<+그림책>", "유아 명작 동화", "<+이야기>"],
  "url_slug": "<영문 슬러그, 예: cinderella-fairy-tale-for-kids>",
  "meta_description": "<150자 내외, 주제어 포함, 줄거리·교훈·읽어주는법 요약>",
  "sections": [
    {
      "text_html": "<h2>...</h2><p>...</p>",
      "image_prompt": "<영문, 텍스트 없는 동화 일러스트>",
      "alt": "<한글 대체텍스트>",
      "caption": "<한글 캡션>"
    }
  ]
}
```

## 섹션 구성 (sections, 6개)

명작:

1. `<h2>{주제어}, 어떤 동화인가요?</h2>` — 소개 + primary 키워드 자연 포함
2. `<h2>{작품} 원작 이야기</h2>` — 작가/출처/버전(기본글의 원작 섹션 재구성)
3. `<h2>{주제어} 줄거리 요약</h2>`
4. `<h2>{작품}이 주는 교훈</h2>`
5. `<h2>아이에게 읽어주는 법</h2>` — 부모 가이드 + 추천 연령
6. `<h2>자주 묻는 질문 (FAQ)</h2>` — Q&A 3~4개(`<p><strong>Q.</strong><br>A.</p>`), **image_prompt는 "" 빈값**

자연관찰(나중 단계용):

1. 소개 · 2. 자연/과학 사실 · 3. 탱고북이 다루는 내용 · 4. 핵심 어휘·관찰 포인트 · 5. 부모 가이드(관찰·활동) · 6. FAQ

## 규칙

- 본문 섹션(1~5)은 각각 `<h2>` 1개 + `<p>` 1~2개. primary/secondary 키워드를 제목·본문에 자연스럽게 배치(키워드 스터핑 X).
- `image_prompt`: **영어, 텍스트 없는(no text) 유아 그림책 일러스트** 묘사. 그 섹션 장면 기반. (FAQ는 빈값)
- `meta_description` 150자 내외, 주제어 포함.
- `url_slug` 영문 케밥케이스.
- 톤: 학부모 대상, 따뜻·신뢰. 과장/보장 표현 금지.

## 금지

- git/commit 금지. 배정된 책의 blog JSON 파일만 작성. 다른 파일 수정 금지.
