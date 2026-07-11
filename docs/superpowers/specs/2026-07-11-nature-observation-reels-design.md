# 자연관찰 릴스 파이프라인 설계

- **날짜**: 2026-07-11
- **상태**: 설계 승인 대기 → 파일럿(공룡 5권)
- **관련**: [명작 릴스 파이프라인](2026-07-09-storybook-reels-batch-pipeline-design.md) · memory `storybook-reels-pipeline-2026-07-10`

## 배경 / 문제

명작 51권 릴스 배치 파이프라인(`StorybookReel` + `buildReelProps` + `render-book-reels.ts`)이 완성돼 인스타그램 예약 발행까지 라이브다. 이제 **자연관찰 101권**(육지동물26·공룡21·식물18·곤충9·바다9·하늘8·우주6·우리몸4)에도 릴스를 만들어 같은 마케팅 채널(@tangobook_korea)에 올린다.

그러나 자연관찰은 명작과 **구조적으로 다르다** — 기존 파이프라인을 그대로 쓸 수 없다:

| | 명작 51권 | 자연관찰 101권 |
|---|---|---|
| 콘텐츠 | 서사(줄거리·교훈) | 논픽션(사실·관찰) |
| 그림체 | 3종(콜라주·수채·페이퍼3D) | **1종(사실적/실사풍)** |
| 릴스 USP | "한 권을 3그림체로" 모핑 | 모핑 **불가** |
| 삽화 위치 | `styleAssets[style].pageIllustrations` | **`pages[].illustrationUrl`** (+ top-level `coverImage`) |
| 스토리보드 씬 | 훅·원작·줄거리·교훈 | 훅·신기한사실·탱고북내용·관찰포인트 (이미 존재) |

실측 확인: 자연관찰 책 JSON 의 `artStyle`=`photographic`, `styleAssets[*].pageIllustrations`=비어있음, 삽화는 top-level `pages[].illustrationUrl`, 나레이션은 `pages[].ttsUrl`, 사실 데이터는 `educational_content`/`pages[].text`. 현재 `buildReelProps` 는 `styleAssets` 삽화에 의존하므로 자연관찰 책엔 **null 을 반환**한다.

## 목표

- 자연관찰용 **팩트 호기형(fact-driven curiosity)** 릴스 포맷을 설계·구현한다.
- 명작 파이프라인의 재사용 가능한 부분(컴포지션 씬 컴포넌트·배치 러너·IG 예약 스크립트)은 최대한 공유하고, 다른 부분(빌더·이미지 소스·차별화 씬·썸네일)만 신규로 만든다.
- **파일럿 우선**: 공룡 5권으로 톤·정확성 검증 후 101권 확장.

## 비목표 (YAGNI)

- 다국어(현재 ko만; 구조는 언어무관이라 후속 확장 용이).
- 나레이션 TTS 음성 삽입(릴스는 자막 기반 — 명작과 동일, BGM 만).
- 명작 파이프라인 리팩터링(공유 헬퍼만 재사용, 기존 동작 무변경).
- 카테고리별 톤 분기(공룡=웅장 vs 식물=잔잔) — 파일럿에서 단일 톤 검증 후 필요 시 후속.

## 핵심 결정 (브레인스토밍 확정)

1. **컨셉 = 팩트 호기형**: "○○의 신기한 사실" 훅 → 놀라운 사실 → 관찰 포인트 → CTA. 교육 훅은 저장·공유가 강해 알고리즘에 유리, 부모 타겟.
2. **차별화 씬 = 도감 시리즈 정체성**: 명작의 모핑 씬 자리에 8테마 그리드 + "우리 아이 첫 자연도감 100권+". 단권이 아니라 시리즈로 유입.
3. **범위 = 파일럿 먼저**: 공룡 5권 렌더 → 확인 → 101권 확장.

## 씬 구조 (9:16 · ~32s)

| # | 씬 | 길이 | 내용 | 컴포넌트 |
|---|---|---|---|---|
| 1 | 훅 | 4s | 표지/대표 삽화 + "○○, 이런 게 신기해요" 질문형 | `StoryScene` (재사용) |
| 2 | 신기한 사실 | 12s | 실사풍 삽화 몽타주 + 팩트 2~3개 문장단위 순차 노출 (핵심) | `StoryScene` (재사용) |
| 3 | 관찰 포인트 | 5s | "아이와 함께 이런 걸 관찰해보세요" 부모 활용 | `StoryScene` (재사용) |
| 4 | 도감 시리즈 | 5s | 8테마 대표 표지 그리드 + "우리 아이 첫 자연도감 100권+" | `SeriesShowcase` (**신규**) |
| 5 | CTA | 6s | 로고 + 7일 무료체험 + tangobook.co.kr | `Closing` (재사용) |

- 재사용: `StoryScene`(문장단위 순차노출·Ken Burns·적응형 폰트)·`Closing`·BGM(`<Audio loop>` fade).
- 신규: `SeriesShowcase` — `StyleShowcase`(모핑) 자리에 들어가는 8테마 그리드 씬.

## 캡션 원칙 (핵심 품질 포인트)

- **Claude 직접 작성** (Gemini 금지 — 명작과 동일 원칙). 스토리보드 자동생성 자막("기가노토사우루스의 자연·과학 사실", "T." 잘림)은 밋밋·불완전해 그대로 못 씀.
- 자연관찰은 **팩트 정확성이 생명** → 각 책의 `educational_content` / `pages[].text` 를 근거로 사실 확인 후 작성. 세계기록급 수치·연대는 책 데이터 범위에서만.
- 씬별 톤: 훅=호기심 자극("티라노보다 컸다고?") · 사실=놀라운 팩트 2~3개 · 관찰=실천형.
- 저장 위치: `_data/marketing/reel-captions-nature.json` = `{ bookId: [훅, 사실, 관찰] }` (3씬 자막; 도감·CTA 는 정적). 명작 `reel-captions.json` 와 분리.
- 파일럿 5권에서 톤·정확성 먼저 검증.

## 기술 구조

### 신규 빌더 `buildNatureReelProps` (TDD)

`packages/server/src/services/reel/nature-reel-props.ts`. 명작 `buildReelProps` 와 분리(씬 의미·이미지 소스가 다름), 헬퍼(`splitIntoBuckets`·`firstClause`)는 `reel-props.ts` 에서 import 공유.

- 입력: `{ storybook, storyboard, captions?, seriesCovers }`.
- 이미지 소스: `storybook.coverImage`(top-level) + `storybook.pages[].illustrationUrl` (명작의 `styleAssets` 아님). 🔴 한글 파일명 → `encodeURI`.
- 가드: 스토리보드 <5씬 or `pages[].illustrationUrl` 0장 → null.
- 씬 조립: 훅(표지, 4s) + 사실(페이지 버킷, 12s) + 관찰(페이지 버킷, 5s). `SCENE_DURS_NATURE=[4,12,5]`.
- `styleMorph` 대신 `seriesShowcase: { covers: string[8], headline }` 를 prop 으로 반환(모핑 null).
- 자막 우선순위: 손수 `captions[i]` > 스토리보드 `subtitle` > `firstClause(narration)`.

### 신규 컴포지션 씬 `SeriesShowcase`

`packages/remotion/src/components/reels/storybook/SeriesShowcase.tsx`. 8테마 대표 표지 그리드(실사풍) + "우리 아이 첫 자연도감 100권+" 메시지 + 카테고리 라벨. 표지는 각 카테고리 대표 책 표지를 R2 에서 뽑아 prop 으로 주입(순수 빌더가 URL 배열 구성). 정적 8장이라 책마다 동일(모듈 캐시 가능).

### 컴포지션 배선

기존 `StorybookReel` 컴포지션을 확장 또는 신규 `NatureReel` 컴포지션. **결정: 신규 `NatureReel` 컴포지션**(`packages/remotion/src/compositions/NatureReel.tsx`) — StoryScene/Closing 재사용 + SeriesShowcase, `calculateMetadata` 동적 duration. 명작 `StorybookReel` 무변경(회귀 안전). Zod 스키마 `data/nature-reel.ts`.

### 신규 썸네일 `NatureThumb`

명작 3분할(`ThumbStyles`) 대신 1스타일용: 대표 삽화 1장(풀블리드) + 큰 호기심 헤드라인 + 카테고리 배지. `ReelThumbnail.tsx` 에 variant 추가 or 신규 파일.

### 배치 러너 & 발행

- `render-book-reels.ts` 에 `--category=nature` 배선: `resolveNatureBookIds`(books-by-category.json category=/공룡|동물|식물|곤충|바다|하늘|우주|우리 몸/ 필터, 파닉스·명작·backup 제외) + `buildNatureReelProps` + `NatureReel`/`NatureThumb` 선택. 파일럿은 `--book=<id>` 또는 `--category=dino --limit=5`.
- 마케팅 연결: **명작과 동일** — 자연관찰 책도 `mkt_contents.memo='storybook:{id}'` + 캐러셀 행 보유(실측 확인, `has_reel_ko=false`). `connectReelToMarketing` 이 `reels.ko` 병합. 새 행 생성 불필요.
- IG 예약: **기존 `schedule-reels-instagram.ts` 그대로 재사용**(멱등, reel 보유 콘텐츠 자동 수집). 명작 예약과 안 겹침(이미 큐에 있는 콘텐츠 skip). 자연관찰 우선순위는 카테고리순 정렬 후속 옵션.

## 파일럿 범위 & 검증

- **공룡 친구들 5권**(아이 반응 강함): 티라노사우루스·기가노토사우루스·트리케라톱스·브라키오사우루스·벨로키랍토르 (실제 존재 id 는 구현 시 books-by-category.json 에서 확인).
- 렌더 → 로컬 mp4(`out/`) 제시 → 사용자 확인(톤·팩트 정확성·도감 씬·썸네일) → 승인 시 101권 확장 + IG 예약.
- 검증 관점: (1) 팩트가 정확하고 놀라운가 (2) 실사풍 삽화가 9:16 에서 잘 보이는가 (3) 도감 씬이 시리즈성을 전달하는가 (4) 썸네일 후킹.

## 테스트 계획

- `nature-reel-props.test.ts` (TDD): 씬 조립·이미지 소스(`pages[].illustrationUrl`)·가드(pages 0/스토리보드<5)·captions 오버라이드·seriesShowcase prop·`encodeURI`.
- 순수 빌더라 Remotion 렌더 없이 단위 테스트. 명작 `reel-props.test.ts` 패턴 준용.
- 렌더 검증은 파일럿 5권 로컬 mp4 육안.

## 리스크 / 오픈 이슈

- **팩트 정확성**: 자동생성 스토리보드 자막이 부정확·잘림 → 반드시 책 `educational_content` 근거로 손수 검증. 오류 시 학부모 신뢰 타격.
- **101권 캡션 분량**: 명작 46권 손수 캡션 작업량의 2배+. 파일럿 후 카테고리별 톤 템플릿을 잡아 효율화.
- **삽화 화질**: 실사풍 삽화가 9:16 크롭에서 잘리는 정도 — 파일럿에서 `objectFit:cover` 크롭 확인.
- **도감 그리드 표지 선정**: 8 카테고리 대표 표지 1장씩 — 대표성 좋은 것 수동 선별.

## 재사용 요약

| 재사용(무변경) | 신규 |
|---|---|
| `StoryScene`·`Closing`·BGM | `NatureReel` 컴포지션 |
| `splitIntoBuckets`·`firstClause` | `SeriesShowcase` 씬 |
| `render-book-reels.ts` 골격·R2 업로드·`connectReelToMarketing` | `buildNatureReelProps` (TDD) |
| `schedule-reels-instagram.ts` (IG 예약, 그대로) | `NatureThumb` 썸네일 · `reel-captions-nature.json` |
