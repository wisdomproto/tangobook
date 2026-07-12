# 동화책 표지 다국어화 — 설계 문서

- 날짜: 2026-07-12
- 상태: **구현 완료** (`feat/multilingual-covers`, 미배포). ⚠️ **실행 중 접근 B로 전환** — 아래 설계는 접근 A(런타임 오버레이)였으나, 사용자 요청으로 vi/th/zh는 **제목을 이미지에 구워 `primaryCoverByLang` 등록**(접근 B)으로 구현. 클린 표지 생성·충실도 게이트·`<BookCover>`·폰트 SSOT 등 기반은 그대로 재사용. 파이프라인·결과·재시도 TODO → memory `multilingual-cover-images-2026-07-12`.
- 관련: i18n(`SUPPORTED_LANGUAGES`, `titleTranslations`) · 디자인시스템(coverImage/styleAssets/defaultStyle) · SEO 인프라 · 마케팅 릴스 클린 표지(`feat/nature-reels`)

## 1. 문제

현재 라이브러리 동화책 표지(`coverImage`)에는 **한글 제목이 이미지에 구워져(baked-in)** 있다. 영어·중국어·일본어 등 다른 언어 사용자에게도 한글 표지가 그대로 노출된다. 해외 진출(다국어 hreflang·about 페이지)을 추진 중이라 표지의 언어 정합성이 필요하다.

토대: 마케팅 릴스 썸네일용으로 이미 "텍스트 제거한 클린 표지"를 Gemini 이미지 편집으로 배치 생성한 인프라가 있다(`packages/server/scripts/generate-clean-covers.ts` → R2 → 매핑 `_data/marketing/clean-covers.json`). 단 이 인프라는 **`feat/nature-reels` 브랜치에만** 있고, 매핑 JSON은 git 상 **비어 있어(0줄)** 실제 id→URL 목록이 손에 없다. → 어차피 한 번 재생성이 필요하다.

## 2. 확정된 결정

| # | 결정 | 값 |
|---|------|-----|
| D1 | 커버리지 범위 | **앱 내부 + 외부 공유/SEO(OG)** 모두 |
| D2 | 클린 표지 충실도 정책 | **전량 재생성(강화 프롬프트) + 자동 충실도 게이트**, 실패분만 수동 |
| D3 | 언어별 표지 전략 | **전 언어 통일** — 한국어 포함 모든 언어가 "클린 표지 + 제목 오버레이" (기존 한글 수제 표지는 표시에서 미사용, 데이터는 보존) |
| D4 | 클린 표지 단위 | **그림체별** (명작 3그림체 각각). 실행은 대표 그림체부터 → 나머지 배치 채움 |
| D5 | 오버레이 적용 범위 | **서피스별 선택** — 홀로 선 표지엔 오버레이 ON, 캡션이 옆에 있는 카드는 오버레이 OFF + 캡션 현지화 |

### 제목 오버레이 시각 스펙 (확정)
- **폰트 매핑 테이블** (인앱 CSS `@import` = 서버 TTF 번들 **동일 셋**, 미러 필수):

  | 언어 | 스크립트 | 폰트 | 폴백 |
  |------|----------|------|------|
  | ko | 한글 | **Jua** | system rounded |
  | en·es·fr·de·ms·id | 라틴 | **Baloo 2** | system-ui |
  | vi | 라틴(성조부호) | **Baloo 2** (베트남어 글리프 지원 확인됨) | Be Vietnam Pro |
  | zh | 한자(간체) | **ZCOOL KuaiLe** (站酷快乐) | Noto Sans SC |
  | ja | 가나/한자 | **Noto Sans JP** (라운드 대체 없어 가독 우선) | system |
  | th | 태국어 | **Noto Sans Thai** | system |

  - `SUPPORTED_LANGUAGES` 확장 시 이 테이블에 한 줄 추가 = 인앱·서버 양쪽 반영. 매핑 없으면 라틴(Baloo 2)+system 폴백.
- **색**: 흰색, `text-shadow` 은은하게
- **배치**: 상단 중앙, 필(pill) 형태
- **배경**: 글래스모피즘 — `backdrop-blur` + **다크 틴트 46%**(strong), 흰 테두리 얇게, inset 하이라이트
- **거동**: 긴 제목은 2줄 자동 wrap(`word-break: keep-all`)
- **동일 스펙**을 인앱 CSS 오버레이와 OG/SEO 합성 이미지 양쪽에 적용(합성 이미지에선 backdrop-blur 대신 반투명 다크 라운드로 근사).

## 3. 데이터 모델

기존 `coverImage` 컨벤션을 그대로 미러. 전부 optional, 하위호환.

- `StyleAssets.cleanCoverImage?: string` — 그림체별 클린 표지 URL(정본)
- `Storybook.cleanCoverImage?: string` — 활성/대표 그림체 클린 표지(미러)
- `StorybookSummary` 확장:
  - `cleanCoverImage?: string` — 대표(targetStyle) 클린 표지
  - `cleanCoversByStyle?: Record<string, string>` — 그림체별 클린 표지(`coversByStyle`와 짝)
- **`BookIndexEntry` 확장** (`packages/shared/src/types/book-v2.ts`): 라이브러리 그리드 카드는 `StorybookSummary`가 아니라 **`BookIndexEntry`**(필드명 `coverImageUrl`·`coversByStyle`)를 쓰고, 별도 빌더(`book-v2.repository.ts`)로 채워진다. 여기에도 클린 표지 필드를 추가해야 카드가 레거시 폴백으로 안 빠진다:
  - `cleanCoverImageUrl?: string` (`coverImageUrl` 네이밍 컨벤션에 맞춤)
  - `cleanCoversByStyle?: Record<string, string>`
  - 빌더가 Storybook 레코드의 `cleanCoverImage`/`styleAssets[*].cleanCoverImage`에서 채운다. (동시 세션이 이미 `titleTranslations`를 이 타입에 추가한 선례 있음 — 같은 패턴)
- 제목 현지화는 기존 필드 재사용: `titleTranslations[lang] ?? title`

`toSummary`(`r2.repository.ts`)와 `book-v2.repository.ts` 인덱스 빌더 양쪽에서 `coversByStyle` 산출 로직과 동일한 방식으로 `cleanCoversByStyle` / `cleanCover*`를 채운다.

## 4. 컴포넌트 — `<BookCover>` (design-system)

단일 진입점. 모든 표지 표시 지점이 이걸 쓰도록 교체.

```
props: {
  book: StorybookSummary | BookIndexEntry,
  lang: string,            // 현재 UI/콘텐츠 언어
  style?: string,          // 그림체 (미지정 시 대표)
  overlayTitle?: boolean,  // 홀로 선 표지=true, 캡션 있는 카드=false
  className?, sizes?, ...
}
```

해석 순서:
- **프롭 타입 정규화**: `<BookCover>`는 `StorybookSummary`(`coverImage`/`cleanCoverImage`)와 `BookIndexEntry`(`coverImageUrl`/`cleanCoverImageUrl`) 둘 다 받는다 → 내부 정규화 함수가 필드명 차이를 흡수해 `{ clean, cleanByStyle, legacy, title, titleTranslations }`로 통일.
- 이미지: `cleanByStyle[style] ?? clean ?? legacy(레거시 폴백)`
- 제목: `titleTranslations[lang] ?? title`
- **폴백 안전장치**: 클린 표지가 없으면 레거시 표지를 오버레이 없이 노출 → 롤아웃 중 무중단.
- `overlayTitle=true`일 때만 글래스 필 오버레이 렌더.

폰트: `index.css`에 Jua/Baloo 2/ZCOOL KuaiLe CDN `@import` 추가(기존 폰트 로드 방식과 동일).

### 서피스별 배선 (D5)
- **오버레이 ON (홀로 선 표지)**: `BookDetailPage` 히어로, 연속재생 썸네일(`BookMultiSelectGrid`, `ContinuousBuilder`, `ContinuousHomePage`, `PlaylistLibrarySection`), 뷰어 타이틀(있으면), OG 합성.
- **오버레이 OFF + 캡션 현지화**: 라이브러리 `BookCard`(아래 `<h3>` 캡션을 `titleTranslations` 기반으로 현지화), 학습 리포트 `RecentBooksStrip`/`MetWordsCard`.
- ⚠️ `BookDetailPage`는 현재 언어 토글해도 `storybook.title`(한글) 그대로라 제목 현지화 자체가 누락 상태 → 이번에 함께 수정.

## 5. 클린 표지 생성 파이프라인 (server script)

`generate-clean-covers.ts`를 현재 브랜치로 이식·일반화.

- (책 × 그림체) 순회. 소스 = 각 그림체의 표지 이미지.
- **강화 프롬프트**: 재해석 절대 금지 · 주 피사체/구도/색/원근 100% 보존 · 텍스트와 장식 스티커만 제거하고 배경을 자연스럽게 확장.
- **자동 충실도 게이트**: 생성 직후 비전 모델(Gemini)에 (원본, 클린) 동시 투입 → `{ 주피사체·구도 동일?: bool, 텍스트 잔존?: bool, 사유: string }` 판정.
  - 실패 → 더 엄격한 프롬프트로 재시도(기본 **2회**, `--retries`로 조정).
  - 그래도 실패 → **리뷰 리포트 JSON에 플래그**(수동 확인 대상만 좁힘, 전수 검수 회피).
- 통과분 R2 업로드: 공개 버킷 `covers/clean/{id}-{style}-{ts}.webp`, `Cache-Control: immutable`.
- 결과를 Storybook R2 레코드 `styleAssets[style].cleanCoverImage`(+ 대표는 top-level)에 기록.
- 멱등, 플래그: `--book`, `--style`, `--force`, `--dry-run`, `--limit`. 리뷰 리포트 경로 출력.

## 6. OG / SEO 합성 이미지 (온디맨드 + 캐시)

- 엔드포인트: `GET /api/og/book/:id.png?lang=<code>&style=<id>`
- 기존 OG 생성 인프라(`generate-og-images.mjs`: `sharp` + librsvg + 번들 폰트) 재사용·확장.
- 합성: 클린 표지(cover-fit) + 오버레이(반투명 다크 라운드 46% + 흰 제목, 언어별 폰트). 1200×630.
- 캐시 + **무효화**: 결과를 R2에 저장하되 **캐시 키에 클린 표지 버전을 포함**한다 — `og/book/{id}-{style}-{lang}-{cleanVer}.png`(`cleanVer` = 클린 표지 URL의 타임스탬프/해시). 클린 표지를 `--force` 재생성하면 URL의 ts가 바뀌므로 OG 키도 자동으로 갈라져 **stale 합성물이 서빙되지 않는다**(별도 purge 불필요). 엔드포인트는 요청 시점의 클린 표지 URL에서 `cleanVer`를 도출해 키를 만든다.
- 서버 폰트 번들에 **§2 폰트 매핑 테이블의 전 언어 TTF**(주아·Baloo 2·站酷快乐·Noto Sans JP·Noto Sans Thai 등) 추가 — 인앱 CSS `@import` 셋과 미러(기존 Pretendard 번들 방식과 동일).
- 배선: `BookSeoPage`의 `useSeo` og:image + SSR(`seo-ssr.service.ts`) og 메타를 현재 언어 기준 이 엔드포인트로 교체. 책별 실제 표지 반영.

## 7. 롤아웃 (독립 배포 · 무중단)

폴백(§4) 덕분에 어느 단계에서 멈춰도 안 깨진다.

1. **데이터 필드 + 생성 스크립트 + 게이트** → 대표 그림체 공개 149권 생성. (잃어버린 매핑 문제 해소. 명작 46 + 자연관찰 101 + 기타 공개분; 실제 대상은 스크립트가 공개·표지보유 기준으로 산출)
2. **`<BookCover>` + 인앱 배선** (카드=클린+캡션 현지화 / 홀로선 표지=오버레이). + `BookDetailPage` 제목 현지화 수정.
3. **명작 나머지 그림체 클린** 배치 채움.
4. **OG/SEO 엔드포인트 + BookSeoPage·SSR 배선.**

## 8. 스코프 밖 (YAGNI)

- 언어별 이미지를 **사전 전량 합성 저장(접근 B 풀)**: OG는 온디맨드+캐시로 충분. 전량 사전생성 안 함.
- 오버레이 애니메이션/모션.
- 표지 외 페이지 내부 삽화의 텍스트 다국어화(별도 문제).

## 9. 리스크 / 주의

- **Gemini 재해석 리스크**: 게이트로 대부분 거르되, 최종 대표 표지 후보는 리포트 플래그분 수동 확인. 명작 대표 그림체는 특히 육안 확인 권장.
- **폰트 커버리지**: 언어별 폰트 매핑(한/라틴/중). 일어·태국어·베트남어 등은 폰트 폴백 규칙 필요(예: 일어=Noto Sans JP, 태국어=Noto Sans Thai). 오버레이 폰트 매핑 테이블에 명시.
- **브랜치/워크트리**: 원본 클린 스크립트는 `feat/nature-reels`에만 존재 → 이식. 현재 세션 worktree는 비어 있고 실제 코드는 메인 저장소에 있음 → 구현은 메인 저장소에서.
- **R2 데이터 호환**: 새 필드 전부 optional, 기존 211+권 무영향.
