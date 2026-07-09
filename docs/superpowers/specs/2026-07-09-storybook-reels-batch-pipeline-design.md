# 동화책 릴스 배치 파이프라인 — 설계

작성일: 2026-07-09 · 상태: 설계 승인 대기

## 배경

개구리 왕자 마케팅 릴스(9:16, 40s, Remotion)를 손으로 만들어 완성했다
(`FrogPrinceReel`). 이제 이 릴스를 **책마다 자동 생성**해 마케팅 페이지의
릴스 채널에 올린다. 첫 대상은 **세계명작 51권 · 한국어**(파일럿), 검증 후
자연관찰 101권으로 확장한다.

기존 자산·구조:
- 전 책 152권에 마케팅 **스토리보드 JSON**(`packages/server/scripts/_data/marketing/storyboards/{id}.json`)
  이 있다. 5장면 구조가 책 종류에 맞게 적응됨(명작=훅·원작·줄거리·교훈·CTA /
  자연관찰=훅·신기한 사실·탱고북 내용·관찰 포인트·CTA). 각 장면에 `label`,
  `subtitle`, `narration`, `imagePrompt`.
- 책 데이터는 R2 `storybook-{id}.json`. 삽화는 `styleAssets[styleId].pageIllustrations["N"].illustrationUrl`,
  표지는 `styleAssets[styleId].coverImage`. 활성 그림체 = `artStyle`.
- 그림체 장르 매핑 = R2 `_index/style-genre-map.json`(styleId→`watercolor|paper3d|collage`).
  학습자/부모 노출은 **장르명만**(스튜디오 실명 금지) — 릴스도 이 정책을 따른다.
- 마케팅 릴스 저장 모델(`ReelsPanel.tsx`): 콘텐츠는 `mkt_contents.memo = "storybook:{id}"`
  로 책과 연결. 릴스 언어별 `{videoUrl, coverUrl}`은
  `mkt_instagram_contents[0].video_settings.reels[lang]`에 저장. R2 키 패턴
  `mkt/{projectId}/reels/...`.

## 목표 / 비목표

**목표**
- `FrogPrinceReel`을 **props 기반 일반 컴포지션 `StorybookReel`**로 리팩터링(개구리
  왕자는 이 컴포지션의 첫 사례가 됨).
- bookId → 릴스 `inputProps`를 만드는 **props 빌더**(스토리보드 + 책 삽화에서 자동 조립).
- **배치 렌더 + R2 업로드 + Supabase 자동 연결** 스크립트.
- 명작 51권 한국어 릴스를 마케팅 페이지 릴스 탭에서 바로 볼 수 있게 한다.

**비목표(이번 범위 아님)**
- 다국어 릴스(ko만). 스토리보드/자막 구조는 언어무관이라 후속 확장 용이.
- 나레이션 음성(무음 + BGM, 개구리 왕자와 동일 컨벤션).
- 자연관찰 101권(파일럿 검증 후 별도).
- 자막 손튜닝(자동 생성으로 뽑고 파일럿에서 빌더 규칙만 개선).

## 아키텍처

세 개의 분리된 유닛 + 격리 실행.

### 1. `StorybookReel` 컴포지션 (`packages/remotion/`)

Zod `inputProps` 스키마:
```
{
  bookTitle: string,
  scenes: Array<{ label: string; body: string; imageUrls: string[] }>, // 4장면(훅~교훈)
  styleMorph: {                       // null 이면 모핑 씬 생략
    lines: string[];                  // 예: ['탱고북에선','한 권의 이야기를','아이의 취향대로 고를 수 있습니다']
    styles: Array<{ url: string; label: string }>; // 명작=3개 고정 (콜라주→수채동화풍→페이퍼 3D, 장르명 라벨)
  } | null,
}
```
- 이미지는 **R2 URL을 `<Img src>`로 직접 로드**(staticFile 아님). ⚠️ R2 삽화 URL은
  **한글 파일명 포함** → 빌더가 반드시 `encodeURI` 적용(마케팅 파이프라인 기존 gotcha:
  raw 한글 R2 URL은 400). 원격 로드가 헤드리스 렌더에서 지연/타임아웃 위험이 있어
  `delayRenderTimeoutInMilliseconds`를 여유있게(예: 60s) 설정하고, **1권 dry-run에서
  원격 이미지 렌더 성공을 명시적으로 검증**한다. dry-run에서 원격 로드가 불안정하면
  **폴백**: 그 책 삽화를 로컬 임시 디렉터리로 선다운로드 후 `staticFile`(frog 방식)로
  전환(플랜에서 결정).
- BGM은 로컬 staticFile. `frog/` → `storybook/` 추출 시 **중립 경로 `reels/bgm.mp3`**로
  이동(일반 컴포지션이 frog 전용 경로를 들지 않도록).
- `calculateMetadata`가 props에서 총 프레임 계산: 훅 4s + (장면 수−1)×8s +
  (styleMorph ? 6s : 0) + CTA 6s.
- 기존 Frog 컴포넌트(`FrogStoryScene`/`FrogStyleShowcase`/`FrogClosing`)를 일반
  컴포넌트로 이동·prop화(`frog/` → `storybook/`). `FrogPrinceReel`은 얇은 래퍼로
  남기거나 제거(개구리 왕자도 배치로 재생성).
- **디그레이드**: `styleMorph=null`이면 모핑 씬 생략, 나머지 릴스는 정상.

### 2. props 빌더 (`packages/server/scripts/build-reel-props.mjs`)

`(bookId) → inputProps`:
- 책 JSON(R2) + 스토리보드 JSON(disk) 로드.
- **장면 매핑**(명작 기준 4장면 + 모핑):
  - 훅: 표지 또는 1페이지 1장.
  - 장면 2~4: 활성 그림체 `pageIllustrations`를 페이지 순서로 3구간 균등 분배(초/중/말).
  - 자막: `label`(칩) + **나레이션 첫 문장**(본문, 문장부호 기준 트림, 최대 ~40자).
  - CTA: 로고 카드(고정). 스토리보드의 자체 CTA 장면은 사용하지 않음.
- **입력 가드**: 스토리보드가 5장면 구조(훅 + 본문 3 + CTA)가 아니거나 활성 그림체
  삽화가 하나도 없으면 그 책은 `null` 반환 → 배치 러너가 스킵. (명작 51권은 시드로
  콘텐츠·삽화가 갖춰져 있어 스킵은 예외 케이스.)
- **모핑 씬 = 항상 3개 그림체**: 명작 51권은 **균일하게 동일한 3개 그림체**를 가진다
  — `style-genre-map` 기준 **콜라주·수채동화풍·페이퍼 3D**, 각 그림체가 전 페이지를
  보유(샘플 4권 실측: 3권 모두 3개 그림체 × 15페이지 전부 공통). 따라서 `styleMorph`는
  **콜라주 → 수채동화풍 → 페이퍼 3D 고정 순서**로 3개 구성.
  - 페이지 선택: 세 그림체에 **공통으로 존재하는 페이지 인덱스 중 가장 큰 값**(=이야기
    후반/클라이맥스, 결정적·테스트 가능). 개구리 왕자는 12페이지(변신)였음 — 책마다
    최대 공통 인덱스로 자동 결정.
  - lines는 고정 카피(위 예시). 책 제목 비의존이라 재사용 가능.
  - **안전 폴백**(비정상 데이터 대비, 명작에선 발생 안 할 예외): 매핑된 그림체가 2개
    미만이거나 공통 페이지가 없으면 `styleMorph=null`(모핑 씬 생략).
- 순수 함수로 작성(입력 JSON 2개 → props 객체), 단위 테스트 가능.

### 3. 배치 러너 (`packages/server/scripts/render-book-reels.mjs`)

**렌더 부트스트랩(배치 시작 시 1회)**: `bundle({entryPoint: remotionEntry})`로
Remotion 번들을 만들어 serveUrl을 캐시(audiobook.service 패턴 그대로). Remotion은
Chromium을 lazy import(Railway 노트) — 로컬 실행이라 문제 없음.

각 bookId에 대해:
1. `build-reel-props` → inputProps (없으면 스킵).
2. `selectComposition({serveUrl, id:'StorybookReel', inputProps})` → 동적 duration
   해석 → `renderMedia({composition, serveUrl, inputProps, imageFormat:'png',
   delayRenderTimeoutInMilliseconds:60000})` → 로컬 mp4.
3. R2 업로드: 표지(책 표지 webp) + mp4 → `mkt/{projectId}/reels/{id}-{ts}.mp4`.
   (R2 provider 직접 PUT, 서버 크리덴셜.)
4. Supabase(서비스롤): `mkt_contents.memo='storybook:{id}'`로 content_id·project_id
   조회 → **그 콘텐츠의 기존 인스타(캐러셀) 행을 resolve**(카드뉴스 시드가 이미 생성해둠;
   `ReelsPanel`은 `instagramContents[0]` 단일행 규약에 의존) → **그 행의**
   `video_settings.reels.ko = {videoUrl, coverUrl}`만 병합 업데이트. 행이 정말 없을
   때만 신규 생성(두 번째 인스타 행을 만들지 않아 `[0]` 불변식 보존).
   - `user_id`는 다른 시드 스크립트와 동일하게 **`--owner-email` → `auth.users`**로
     resolve해 스탬프.
5. 로그/요약(성공·스킵·모핑 유무).

- **--dry-run / --limit / --book=<id> / --owner-email=<email>** 플래그. 기본 명작 필터.
- **먼저 1권 실행** → 마케팅 페이지에서 확인 → 51권 배치.

### 4. 격리 실행

- 다른 세션의 브랜치 전환으로 인한 유실 방지: **worktree `feat/storybook-reels`**
  (frog 커밋 위에서 분기해 `StorybookReel` 일반화를 이어감).
- 배치는 로컬 렌더(~2분/권 × 51 ≈ 1.5–2h). 산출물은 R2 + Supabase.

## 데이터 흐름

```
storyboard JSON ─┐
                 ├─ build-reel-props → inputProps ─ renderMedia → mp4 ─┐
storybook JSON ──┘                                                     ├─ R2 put
style-genre-map ─┘ (모핑 판정)                              책 표지 ───┘
                                                                        │
                              mkt_contents(memo) → content/project id ──┴─ mkt_instagram_contents.video_settings.reels.ko
```

## 에러 처리 / 디그레이드

- 스토리보드 없음 / 삽화 부족(장면당 1장도 없음) → 그 책 스킵 + 로그.
- 그림체 <2 → 모핑 씬 생략(정상 릴스).
- R2/Supabase 실패 → 그 책만 실패 기록하고 계속(배치 중단 금지).
- mp4는 R2에만; 로컬 out/은 gitignore.

## 테스트

- `build-reel-props` 순수 로직 단위 테스트: 명작 샘플·자연관찰 샘플·그림체 1개
  책 각각에 대해 (장면 수, imageUrls 채움, styleMorph 유무) 검증.
- `StorybookReel` `calculateMetadata` 프레임 계산 테스트(모핑 유/무).
- 통합: 1권 dry-run 렌더 스틸/mp4 육안 확인 + 마케팅 페이지 연결 확인.

## 리스크

- 자동 자막 품질이 손튜닝(개구리 왕자)보다 낮음 → 파일럿에서 빌더 규칙 개선(YAGNI:
  지금은 라벨+첫 문장).
- (해소됨) 명작 그림체 커버리지 = 균일하게 3개(콜라주·수채·페이퍼3D) × 전 페이지
  — 샘플 4권 실측 확인. 모핑은 51권 전부 3개로 나옴.
- Supabase mkt 행/프로젝트 매핑 실측 필요 → 1권 dry-run에서 검증.
- 다른 세션과의 repo 경합 → worktree 격리.
