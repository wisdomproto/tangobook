# /editor2 단일 구조 저작도구

v1 storybook 데이터 모델 위의 저작도구. /editor 는 안전 백업으로 유지.
🔴 **한 책 = 한 그림체 · 한 레벨**(2026-09-14) — 예전의 3축 variation(레벨 사본 `__L2` · `styleAssets` 그림체 swap · `defaultStyle`)은 걷어냈다. 같은 이야기의 다른 그림체는 다른 책이고 **책 그룹**이 잇는다(`/library-master`). 남은 축은 **언어** 하나.

## 라우트 + 레이아웃

- `/editor` (v1 백업, **절대 안 건드림**) · `/editor2(/:bid)`
- `AppLayoutV2` — TopBar + v1 Sidebar + `EditorPanelV2`
- `LevelEditCard` — 책 한 권의 카드(이름은 옛 레벨 카드에서 남음). 🔴 **맨 윗줄 하나**: 제목 · 레벨 · 쪽수 · 🔒비공개 · [공개 ko] · [저장] · ▴ — 펼치면 CardBody 가 그리고 `EditorContent hideHeader` 로 옛 헤더를 끈다(두 줄이 같은 말을 했다). 그 아래 그림체 줄(`ArtStyleSelect` + ⚙️ 그림체 편집) · 언어 줄 · 탭.
- 탭 순서 = **기본설정 → 책 관리 → 캐릭터 → 표지 …**
- `BookManageTab`(「책 관리」) — `BookInfoSection`(📋 책 정보: 제목·언어별 제목·카테고리(folder 같이)·그림체·레벨·연령·공개(`applyBookPublic` 로 셀과 같이)·무료 편집 / 언어·그룹·원본 책·ID·날짜 보기 + 표지) + 콘텐츠 설정 + (그림체 × 언어) 완성도 매트릭스.

## 그림체

- 🔴 **라이브러리 안에서만 고른다** — `ArtStyleSelect`(`components/ArtStyleSelect.tsx`) 하나를 그림체 줄 · 기본설정 · 라이브러리 창이 같이 쓴다. 바꾸는 규칙은 `applyArtStyle(draft, id)`(`lib/style-assets.ts`, `publicByStyleLang` 키 이동 포함). 자유 입력·프리셋 프롬프트는 없앴다.
- 라이브러리 = R2 `art-style-library.json`(`SavedArtStyle`: id·name·prompt + `genre?`(학습자 갈래, 명작 셋) + `aliases?`(합쳐진 옛 id)). 🔴 그림체 추가는 그대로(「⚙️ 그림체 편집」 `StyleLibraryEditModal`, 기본설정의 이미지→프롬프트 추출 → 「라이브러리에 저장」).
- ⚠️ `genre` 는 데이터에만 있고 편집 창에 칸이 없다 — 명작 그림체를 새로 만들면 필요.
- `findArtStylePreset(value, lib)` 는 id·프롬프트·`aliases` 로 찾는다.

## 언어

- `Storybook.languages?`, `titleTranslations?`, `KeyObject.nameTranslations?`, `KeyObject.ttsUrls?`, `Page.translations[lang]`.
- `EditorLangContext`(`contexts/EditorLangContext.tsx`) + `useEditorLang()` — /editor2 만 `EditorLangProvider` 로 감싼다. 탭들이 활성 언어를 따라간다.
- `+ 언어` → `AddLanguageConfirmModal`(이미지 공유, 텍스트/TTS 만 새로).

## EditorContent 재사용

`EditorContent` optional props (default = v1 동작): `hideHeader` · `headerExtraActions` · `headerExtraLeft` · `compactHeader` · `hiddenTabIds`(`['quiz','blog','card-news']`).

## 숨은그림 탭

`HiddenObjectEditorTab`(`features/games/components/`) — 씬은 책의 `hiddenObjectScenes`. 상세 → [features/games/CLAUDE.md](../games/CLAUDE.md).

## KeyObject TTS

`KeyObjectTab` 🎙 TTS + 일괄 생성 → `obj.ttsUrl`(ko) / `obj.ttsUrls[lang]`.

상세: memory `one-book-one-style-2026-09-14` (옛 설계 `editor2-variant-system` 은 뒤집혔다)
