# 콘텐츠 파이프라인 관제탑 — 설계

2026-07-16 · 승인됨 (저작 관제탑=editor2 / 발행 관제탑=/marketing 이원화)

## 목적

시리즈가 늘어나는 콘텐츠(명작·자연관찰·생활동화 → 유치원·전래동화·학습만화·창작동화)의
**저작 완성 → 마케팅 자산(릴스·롱폼 × ko/en) → 발행 예약** 전 과정을 시스템으로 관리한다.

- "뭐가 어디까지 됐는지"를 **자동 감사**로 한눈에 (수동 집계 금지)
- 사람 개입은 **저작 승인 체크 1곳**(책 단위)으로 최소화
- 승인된 책의 부족한 마케팅 자산이 **할 일로 자동 도출**되고, 원커맨드/버튼으로 채움

역할 분리(핵심 요구): **콘텐츠 직원은 editor2만 본다.**
- **editor2 = 저작 관제탑**: 전체 콘텐츠 완성도 매트릭스 + 저작 승인 체크. 마케팅 정보 비노출.
- **/marketing = 발행 관제탑**: 승인된 책 기준 마케팅 자산·발행·예약 현황 + 할 일. 대표 전용.
- 두 화면의 유일한 접점 = **승인 상태**(단방향: 직원 승인 → 마케팅 소비).

## 승인 모델

- **단위 = 책(bookId) 단위** 단일 체크. 언어별 완성도는 자동 표시일 뿐 승인 대상 아님
  (en 미번역이어도 승인 가능 — 파이프라인이 "en 자산은 번역 대기"로 표시).
- 저장 = R2 `_index/content-approval.json` `{ bookId: { approvedAt, by? } }`
  — `saenghwal-status` 패턴 그대로 (라우트 `content-approval.routes.ts`, GET/PUT).
- 승인 해제 가능(체크 토글). 해제해도 이미 발행된 마케팅 자산은 건드리지 않는다(현황만 반영).

## 시리즈 레지스트리 (`shared` 또는 server 상수)

카테고리 문자열에 흩어진 시리즈 정보를 명시적 축으로. 시리즈마다 **자산 규칙**을 선언:

```ts
interface SeriesRule {
  key: string;              // 'classic' | 'nature' | 'life' | 'kindergarten' | 'folk' | ...
  label: string;            // 세계 명작 / 자연관찰 / 생활동화 / 유치원동화 / 전래동화 ...
  categories: string[];     // R2 category 매칭 (예: ['세계 명작'], ['생활동화'])
  artStyleMode: 'styles3' | 'base';  // 명작=그림체3종 / 자연·생활=base 삽화
  reelPipeline: 'storyboard' | 'nature' | 'derive';  // 릴스 소스 (명작 storyboard / 자연 captions / 생활 derive)
  marketingChain?: 'saenghwal';       // 생활동화식 기본글→블로그→카드뉴스 파생 체인 여부
}
```

- 신규 시리즈(전래동화 등) 추가 = 레지스트리에 규칙 1블록 + (필요시) 캡션 파일.
- 매칭 안 되는 카테고리는 관제탑에 "미분류"로 노출(누락 방지).

## 자동 감사 (audit service)

서버 `content-pipeline.service.ts` — R2 + Supabase를 스캔해 책별 상태 매트릭스 생성.
전부 **기존 데이터에서 파생**(신규 저작 플래그 없음):

| 항목 | 소스 |
| --- | --- |
| 책 목록·카테고리·공개 | R2 storybook 목록 (`toSummary`: category, `publicByStyleLang`, `koCompletion`, languages) |
| 언어별 완성도(자막·TTS·삽화·표지) | storybook JSON `pages[].translations[lang]`, `styleAssets`, `primaryCoverByLang` — en 백필 감사(audit-books.mjs) 로직 이식 |
| 저작 승인 | R2 `_index/content-approval.json` |
| 릴스(언어별) | `mkt_instagram_contents.video_settings.reels[lang].videoUrl` |
| 롱폼(그림체×언어) | `mkt_youtube_contents` 행 (`video_settings`의 artStyle/lang) |
| 블로그·카드뉴스 | `mkt_blog_contents` / `mkt_instagram_cards` |
| 발행·예약 | `mkt_publish_records` (channel·status·scheduled_at) |
| 유튜브 쇼츠 업로드 | shorts-upload-state (→ R2 이동, 아래) |

응답 형태(책 1행):

```jsonc
{
  "bookId": "…", "title": "…", "series": "classic",
  "authoring": {                       // editor2 가 보는 부분
    "approved": true,
    "public": true,
    "langs": { "ko": { "text": true, "tts": true, "illust": true, "cover": true }, "en": { … } }
  },
  "marketing": {                       // marketing 만 보는 부분
    "reels": { "ko": true, "en": false },
    "longform": { "ko": ["paper3d","watercolor","collage"], "en": [] },
    "blog": true, "cardnews": true,
    "published": { "youtubeShorts": true, "youtubeLongform": "scheduled", "instagram": true }
  }
}
```

- 감사는 요청 시 계산 + 캐시 5분(`?refresh=1` 로 강제 갱신). **승인 상태는 캐시에 굽지 않고
  매 요청 fresh 로드해 merge** — editor2 토글 → marketing 즉시 반영. 풀 JSON 은 동시 8 pool 페치.

## 서버 API

| 메서드 | 경로 | 역할 | 소비자 |
| --- | --- | --- | --- |
| GET | `/api/content-pipeline/authoring` | 저작 매트릭스(승인+완성도만, 마케팅 필드 제외) | editor2 |
| GET/PUT | `/api/content-approval` | 승인 상태 조회/토글 (vocab-overrides 패턴) | editor2 |
| GET | `/api/mkt/pipeline` | 전체 매트릭스 + 할 일 목록 (server-proxy 레인) | marketing |

- `/api/mkt/pipeline`은 마케팅 레인 관례(서버 시크릿·service role) 준수.
- editor2 쪽은 저작도구 내부 API(무인증, 기존 저작 라우트와 동일 취급).

## 화면 ① editor2 — 저작 관제탑 (직원용)

- 진입: EditorPanelV2 헤더 버튼 **「📋 콘텐츠 현황」** → 풀스크린 매트릭스 모달
  (CleanCoverMatrixModal 패턴 재사용).
- 표: 시리즈 필터 칩 + 행=책, 열=`공개 | ko(삽화·자막·TTS·표지) | en | vi | zh | th | ✅승인`.
  셀은 ✓/✗/– (–=해당 없음, 예: 미지원 언어). 언어 열은 4항목 축약 도트로.
- **승인 체크박스** 클릭 → PUT `/api/content-approval` 즉시 저장(낙관적 갱신).
- 마케팅 관련 열 없음. 발행 상태 없음.

## 화면 ② /marketing — 발행 관제탑 (대표용)

- 진입: 마케팅 사이드바 새 항목 **「파이프라인」**.
- 상단 요약 카드: 승인 n권 · 릴스 없는 승인책 n · en 롱폼 없는 승인책 n · 예약 대기 n.
- 매트릭스: 승인책 기준, 열=`릴스 ko/en | 롱폼 ko/en(그림체 도트) | 블로그 | 카드뉴스 | 쇼츠 | 롱폼발행 | 인스타`.
- **할 일 패널**: 시리즈별로 묶어 자동 도출 + 실행 수단 표기:
  - 렌더류(릴스·롱폼) → **로컬 커맨드 표시**(복사 버튼): 예 `render-book-reels --books=a,b,c`.
    Remotion 렌더는 대표 PC 로컬 실행이 현실 제약 — 1차는 커맨드 안내까지.
    (2차 후보: 로컬 러너가 서버 작업큐 폴링 → 버튼 한 방. 이번 범위 아님.)
  - 예약류(발행 스케줄) → **서버에서 가능하므로 버튼**: `mkt_publish_records` insert
    (기존 schedule-* 스크립트 로직을 서비스로 추출).

## shorts-upload-state R2 이동 (내구성)

현재 `docs/marketing/drafts/shorts-upload-state.json`(로컬·gitignore)은 PC 유실 = 상태 유실.
→ R2 `_index/shorts-upload-state.json`으로 이동, `upload-shorts-youtube.mjs`·
`comment-shorts.mjs`·`update-shorts-metadata.mjs`가 R2 read/write (로컬 파일은 폴백/캐시).
감사 서비스도 이걸 읽는다.

## 옛 마스터파일 정리 방침

- **관제탑이 "현황 SSOT"로 승격.** 용도 다른 도구(vocabulary-master, key-object-editor,
  saenghwal 기획서)는 유지.
- 관제탑 가동 후: `/library-master`의 📊 BookMatrixModal 등 "현황 파악" 중복 기능은
  관제탑 링크로 대체 검토(별도 후속, 이번 범위 아님).

## 구현 단계

1. **서버**: 시리즈 레지스트리 + audit service + `/api/content-approval` + 두 조회 API (+테스트)
2. **editor2**: 콘텐츠 현황 모달 + 승인 체크
3. **marketing**: 파이프라인 탭 (요약·매트릭스·할 일·예약 버튼)
4. **state R2 이동**: shorts 스크립트 3종 수정
5. (후속) 옛 현황 파일 정리 · 로컬 렌더 러너

## 이번 범위 아님

- 마케팅 페이지 버튼으로 원격 렌더 실행(로컬 러너) — 2차
- vi/zh/th 마케팅 자산(릴스·롱폼) 파이프라인 — en 안착 후
- 승인 이력/감사 로그, 직원 계정별 권한
