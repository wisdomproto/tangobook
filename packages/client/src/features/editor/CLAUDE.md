# /editor2 단일 구조 저작도구

표지 제목의 기본 서체 선택/색/지원 글자 확인은 [표지 전용 폰트 지침](../../../../../docs/cover-fonts.md)을 따른다. 운영 자산 등록과 편집기 UI 적용은 별도 상태로 관리한다.

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

`EditorContent` optional props (default = v1 동작): `hideHeader` · `headerExtraActions` · `headerExtraLeft` · `compactHeader` · `hiddenTabIds` · `videoLibrary`. Editor2는 `hiddenTabIds=['quiz','blog','card-news','audiobook']`, `videoLibrary=true`.

## 영상

Editor2의 오디오북 탭은 숨기고 기존 `longform-video` 탭 ID를 유지해 표시명은 **영상**으로 바꿨다. 새 `features/book-video`는 롱폼(16:9)/숏폼(9:16) 공통 원본, 언어별 완성 영상·썸네일·영상용 SRT·나레이션 음원/대본을 관리한다. 책 본문/페이지 TTS와 별개이며 `onUpdate`로 책에 섞어 저장하지 않는다. 탭 전환 시 편집 중인 영상 자료는 유지한다.

R2 `book-videos/{bookId}/index.json`에 제작 버전, `files/{uuid}.{ext}`에 파일을 한 번 저장한다. revision/ETag로 동시 저장 충돌을 막고 새 저장은 이전 버전을 보존한다. 서버 `/api/storybooks/:id/videos` GET/POST, `/presign` POST, `/marketing` POST는 운영자 인증을 적용한다. 마케팅 등록은 저장된 언어별 완성 영상만 참조하며 공통 원본을 그대로 게시 대상으로 삼지 않는다. 동일 버전 등록 재시도는 중복을 만들지 않고 새 버전은 새 콘텐츠로 등록한다. 버튼은 외부 게시/예약을 실행하지 않는다.

`LocalCompositionPanel`은 공통 원본 + 현재 언어 음원/SRT를 FFmpeg.wasm Worker로 브라우저에서 합성한다. 단일 스레드 core로 COOP/COEP/SharedArrayBuffer가 필요 없다. 한글 자막은 번들 Pretendard + ASS로 입히며 크기 기본값은 1080p 롱폼 88px/가로1080 숏폼 80px, 숏폼 하단 17% 여백. 원본 소리 보존/혼합과 나레이션 교체를 선택할 수 있고 음원이 짧아도 원본 영상 길이를 유지한다. 합성은 최대 512MB 원본, 업로드 자체는 2GB. 결과는 로컬 미리보기/다운로드 후 ‘완성 영상으로 적용’하면 업로드되고 별도 저장한다. 합성 시작만으로 서버 렌더링/업로드/마케팅 게시를 하지 않는다.

2026-10-02 사용자 요청으로 기존 책 영상 프로젝트·마케팅 영상 연결과 참조 R2 MP4를 정리했다. 재현/실행·검증 결과는 [작업 기록](../../../../../docs/work/authoring/tasks/20261002-editor2-video-library.md).

## 숨은그림 탭

`HiddenObjectEditorTab`(`features/games/components/`) — 씬은 책의 `hiddenObjectScenes`. 상세 → [features/games/CLAUDE.md](../games/CLAUDE.md).

## 장면 색칠 탭 (2026-10-03)

editor2 동화책만 `showSceneColoring`으로 활성화. `SceneColoringEditorTab`은 책 ID catalog의 원본/도안과 실제 `ColoringPlayer` 미리보기를 제공한다. 탭/책 이동 시 게임을 언마운트해 소리를 정리한다. catalog 갱신은 `scripts/build-editor-scene-coloring-catalog.mjs`; 기존 책 본문 일괄 덮어쓰기 없음. 상세 [작업 기록](../../../../../docs/work/authoring/tasks/20261003-editor2-scene-coloring.md).

## KeyObject TTS

`KeyObjectTab` 🎙 TTS + 일괄 생성 → `obj.ttsUrl`(ko) / `obj.ttsUrls[lang]`.

상세: memory `one-book-one-style-2026-09-14` (옛 설계 `editor2-variant-system` 은 뒤집혔다)
