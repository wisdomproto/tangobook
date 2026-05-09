# /editor2 단일 구조 저작도구

v1 storybook 데이터 모델 위에 **레벨/그림체/언어 3축 variation** 인라인 추가. v2 prefix tree(별도 R2 구조)는 폐기, /editor 는 안전 백업으로 유지.

## 라우트 + 레이아웃

- `/editor` (v1 백업, **절대 안 건드림**) · `/editor2(/:bid)` (v1 업그레이드 작업용)
- `AppLayoutV2` (`components/AppLayoutV2.tsx`) — TopBar + v1 Sidebar + EditorPanelV2
- `EditorPanelV2` (`features/editor/components/EditorPanelV2.tsx`) — LevelEditCard stack only (전체 family 메타 뷰는 폐기, 책 1권 단위 메타는 `BookManageTab` 으로 이동)
- `LevelEditCard` (`features/editor/components/LevelEditCard.tsx`) — 단일 펼침 accordion. 카드 1개 = 레벨 1개. 펼치면 그림체/언어 chip row + v1 EditorContent 재사용 (한 줄 헤더 + 저장 옆 🗑 삭제)
- `BookManageTab` (`features/editor/components/BookManageTab.tsx`) — **책 1권 단위 메타 탭 ("책 관리").** 메인 그림체(`defaultStyle`) selector + (그림체 × 언어) 완성도 매트릭스 (표지/페이지글/삽화/TTS/영상/게임). EditorContent 의 첫 탭으로 등록.
- `OtherStyleReference` (`features/editor/components/OtherStyleReference.tsx`) — 다른 그림체의 같은 슬롯 이미지 참고 썸네일 (slot=cover/character/page/keyObject)
- `VariantConfirmModals` — 추가 시 안내 모달 (레벨/언어/그림체)

## 3축 variant 데이터 모델 (모두 v1 Storybook에 추가, optional)

- **레벨**: sibling pattern `${baseId}__L1`/L2/L3. `Storybook.readingLevel`. 추가는 `POST /api/storybooks/:id/variants/:level` (`StorybookService.createVariant`). 기존 `__L4` suffix doc은 R2에 그대로, readingLevel만 L3로 update.
- **그림체**: `Storybook.availableStyles?: string[]` + `Storybook.styleAssets?: Record<style, StyleAssets>` (그림체별 자산 분리). `switchStyleAssets(draft, newStyle)` 헬퍼 (`features/editor/lib/style-assets.ts`) 가 swap 시 top-level 스냅샷 + 새 그림체 자산 복원/비우기. `StyleAssets`: coverImages·coverImage·coverPrompt·primaryCoverByLang·characterImages[]·pageIllustrations{pageNumber→}·keyObjectImages·vocabularyImages.
- **언어**: `Storybook.languages?: string[]`, `defaultLanguage?`, `titleTranslations?: Record<lang, string>`, `KeyObject.nameTranslations?`, `KeyObject.ttsUrl?` + `ttsUrls?: Record<lang, string>` (학습게임 음성 재생). 페이지 텍스트는 기존 `Page.translations[lang]`.
- **(그림체 × 언어) 대표 표지**: `StyleAssets.primaryCoverByLang?: Record<lang, imageUrl>` — 그림체별 자산 안에서 언어별 대표 마커. `switchStyleAssets` swap 사이클 포함 → 그림체 전환 시 마커도 함께 이동. CoverTab 의 "대표" radio 가 활성 (style, lang) 조합당 한 표지를 지정.
- **언어 컨텍스트**: `EditorLangContext` (`contexts/EditorLangContext.tsx`) + `useEditorLang()` 훅 — null fallback. /editor 는 미주입(자체 fallback), /editor2 만 `EditorLangProvider` 로 감쌈. PagesTab/CoverTab/CharacterTab/KeyObjectTab/AudiobookTab/LongformVideoTab/GamesTab 가 외부 활성 언어를 자동 따라감.

## EditorContent 재사용 (v1 무변경 + 옵션 prop 추가)

`EditorContent` 와 `EditorHeader` 에 모두 optional props (default = v1 동작 유지):

- `headerExtraActions?: ReactNode` — 저장 버튼 옆 (LevelEditCard 가 🗑 삭제 버튼 주입)
- `compactHeader?: boolean` — 한 줄 헤더 (제목 + meta + 버튼 같은 행)
- `hiddenTabIds?: string[]` — 탭 가림 (`['quiz','blog','card-news']` 마케팅 숨김. 마케팅은 별도 도구로 분리 예정)

## 사이드바 variant 그룹핑 (`/editor2` 한정)

`Sidebar.tsx` 에서 `useLocation` 으로 `/editor2` 감지 → `groupVariants` true면 `__L[1-4]$` suffix 책 숨김 (base 만 노출). `+N` 보라색 배지로 variant 갯수 표시.

## 추가/삭제 안내 모달 (UX)

- `+ 레벨 추가` → 무거움 안내 (페이지/일러스트/TTS 새로 작성 필요) + base에서 텍스트만 복사
- `+ 언어 추가` → 가벼움 (이미지 공유, 텍스트/TTS만 새로). 페이지/표지/핵심단어의 AI 일괄 번역 활용
- `+ 그림체 추가` → availableStyles 에 canonical id push + switchStyleAssets 으로 즉시 활성. 텍스트 공유, 일러스트만 새로. dropdown source = R2 art-style-library (`/api/art-style-library`, ART_STYLES 10 preset 자동 seed + 사용자 추가 그림체)
- `⚙️ 그림체 편집` (그림체 row 맨 오른쪽) → `StyleLibraryEditModal` (`features/settings/components`). 인라인 ✏️ 이름/프롬프트 수정, ↑↓ 순서, ➕ 추가, 🗑 제거. preset id 보존 → canonicalize 매칭 그대로. modal 은 conditional render (열림 시만 mount → useQuery 무한 루프 회피)

## KeyObject TTS (학습게임 연동)

- `KeyObjectTab` 에 🎙 TTS 버튼 + 일괄 생성 (translate 옆). 활성 언어 따라 `obj.ttsUrl`(ko) 또는 `obj.ttsUrls[lang]` 에 저장
- 생성 후 자동 재생, 재생성 가능
- `collectStorybookImagePool` (server) 의 keyObject pool 항목에 ttsUrl 포함 → 학습게임 (VocabularyMatching, StoryImage 등) 에서 단어 음성 재생

## 진입점 / 사용 책 예시

- `/editor2/1772510956605` (잭과 콩나무 L3) — paper-craft + pixar-3d 두 그림체, ko + en 두 언어 모두 자산 보유
- `/viewer/1772510956605?lang=ko|en` — 활성 그림체 자산을 사용하여 viewer 가 그대로 작동 (storybook.artStyle 기준 top-level 자산)

## 알려진 follow-up

- 메타뷰 인라인 편집 (parentGuide / 책 메타 변경 + 모든 variant 동기화)
- styleAssets 스토리지 비효율 (한 storybook doc 에 여러 그림체 자산 모두 포함 → 큰 책은 doc 비대화). 추후 별도 R2 prefix 로 분리 검토

상세: [memory/editor2-variant-system.md](../../../../../memory/editor2-variant-system.md)
