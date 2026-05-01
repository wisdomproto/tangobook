# 마케팅 모듈 (블로그 + 카드뉴스)

블로그 글 + 카드뉴스 자동 생성. SEO 점수, 네이버 키워드 검색량 연동.

## 폴더 구조

```
features/blog/
  api/blog.api.ts                # generate, generateConfig, regenerateSection, searchKeywords
  utils/seo-score.ts             # computeSeoScore() — C-Rank + D.I.A.+ (100점)
  components/
    BlogTab.tsx                  # 2단계 플로우 (설정 → 생성)
    BlogConfigForm.tsx           # 제목/주제/키워드/모델 설정
    BlogPostCard.tsx             # 블로그 글 편집 (드래그 정렬, SEO 뱃지)
    BlogSectionEditor.tsx        # 리치텍스트 + AI 글쓰기 + 이미지
    BlogPreviewModal.tsx         # HTML/텍스트 복사
    SeoScoreDisplay.tsx          # SeoScoreBadge + SeoScorePanel
    KeywordSection.tsx           # 키워드 칩 + 네이버 검색 테이블

features/card-news/
  api/card-news.api.ts           # generate (소스: storybook | blog)
  components/
    CardNewsTab.tsx              # 2단계 플로우
    CardNewsConfigForm.tsx       # 소스 + 테마 + 슬라이드 수
    CardNewsProjectCard.tsx      # 프로젝트 편집 (테마, 슬라이드 그리드)
    CardNewsSlideEditor.tsx      # 슬라이드 편집 (이미지 + 텍스트 + 색상)
    CardNewsPreviewModal.tsx     # Canvas PNG 내보내기
```

## 서버 구조

```
server/src/
  services/marketing.service.ts        # 블로그/카드뉴스 비즈니스 로직
  utils/marketing-helpers.ts           # 공통 헬퍼 (컨텍스트 추출, 이미지 풀, 키워드 매핑)
  providers/naver.provider.ts          # 네이버 검색광고 (키워드 검색량)
  controllers/marketing.controller.ts
  routes/marketing.routes.ts           # /blog/generate, /card-news/generate
```

## 2단계 생성 플로우

1. 설정 폼 표시 (`showConfigForm` state)
2. 사용자 입력 → 생성 버튼
3. API → 결과를 storybook에 push → 저장
4. 설정 폼 닫고 프로젝트 카드 표시

## RichTextEditor (`components/RichTextEditor.tsx`)

- `contentEditable` + `document.execCommand()` 기반 WYSIWYG
- 툴바: 단락(H2/H3/H4), 폰트 크기, B/I/U/S, 목록, 텍스트 색상, 형광펜, 서식 제거
- 블로그 섹션 편집에서 사용. HTML 문자열 입출력.

## 공유 클라이언트 컴포넌트/유틸

- `components/DotEditorCanvas.tsx` — 점잇기 편집 캔버스 (DotEditorModal/KeyObjectDotEditorModal 공용)
- `lib/build-available-images.ts` — 동화책 이미지 풀 (표지/삽화/캐릭터/핵심단어)
- `lib/generate-id.ts` — `generateId(prefix?)`
