# Library Master — 언어 토글 (표지 한글/영어 전환)

**작성일**: 2026-05-16
**상태**: 작은 확장 (이전 카테고리 편집 spec 의 후속)

## 배경

표지가 그림체별 + 언어별로 따로 저장됨 (`StyleAssets.primaryCoverByLang[lang]`). 현재 `/library-master` 는 defaultStyle 의 ko 표지만 노출 → 영어 표지가 있어도 확인 불가.

## 목표

`/library-master` 상단에 한글/영어 토글 → 책 카드 표지가 해당 언어 표지로 swap. 없으면 "없음" placeholder 표시.

## 변경

### 서버 (`packages/server/src/repositories/r2.repository.ts:summarizeStorybook`)

`coversByLang?: Record<string, string>` 신규 필드 추출. defaultStyle 기준:

```ts
const coversByLang: Record<string, string> = {};
const targetStyleAssets = sb.styleAssets?.[targetStyle ?? ''];
for (const [lang, url] of Object.entries(targetStyleAssets?.primaryCoverByLang ?? {})) {
  if (url) coversByLang[lang] = url;
}
if (targetStyle === sb.artStyle) {
  for (const [lang, url] of Object.entries(sb.primaryCoverByLang ?? {})) {
    if (url && !coversByLang[lang]) coversByLang[lang] = url;
  }
}
```

### 타입 (`packages/shared/src/types/storybook.ts`)

`StorybookSummary` 에 `coversByLang?: Record<string, string>` 추가.

### 클라 (`packages/client/src/pages/LibraryMasterPage.tsx`)

- 헤더에 언어 chip 토글: `[🇰🇷 한글] [🇺🇸 영어]` (기본 `'ko'`, 페이지 메모리)
- `BookCardEditable` prop `selectedLang: string` 추가
- 카드 표지 결정:
  - `book.coversByLang?.[selectedLang]` 있으면 그 URL
  - 없으면 회색 placeholder + "📭 한글 표지 없음" / "📭 영어 표지 없음"
- 카드 편집/순서/카테고리는 언어 무관 (책 단위 메타)

## Out of scope

- 다른 언어 추가 (현재 ko/en 만)
- 학습자 `/library` 화면 변경
- 그림체 전환 (defaultStyle 기준 그대로 — 그림체 변경은 🎨 모달 그대로)
