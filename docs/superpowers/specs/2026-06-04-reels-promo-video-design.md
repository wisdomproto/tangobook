# 탱고북 릴스 홍보 영상 — 설계 (스토리보드 + 제작 스펙)

> 소비자(B2C) 대상 인스타/릴스·쇼츠 홍보 영상. 저작도구·외부작가 등 공급자 메시지는 **제외**.
> 메시지: 명작동화 · 한글/영어 · 다양한 그림체 · 자연관찰 · 한/영 파닉스 · **오픈베타 무료**.

## 1. 포맷
- **비율/해상도**: 9:16 세로, 1080×1920
- **길이**: 약 22초 (660 frames @ 30fps)
- **사운드**: 나레이션 없음. 비트감 BGM + 효과음. 무음 자동재생 대응 → **자막 필수**
- **톤**: 빠른 컷 전환, 파스텔/따뜻 + 활기. 탱고북 디자인 토큰(coral CTA / peach 배경 / cream) 준수

## 2. 컨셉 — "한 권, 여러 얼굴"
탱고북 최강 무기 = 비주얼(다양한 그림체의 명작동화). 설명형이 아닌 **비주얼 폭격형**.
훅에서 "그림체가 하나일 필요 없다"로 차별점을 즉시 보여주고, 명작 라인업 → 한/영 → 파닉스 → 자연관찰 → 무료로 마무리.

## 3. 스토리보드 (씬별)

| # | 시간 | 화면 | 자막 | 모션·자산 |
|---|------|------|------|-----------|
| 1 훅 | 0–3s | 같은 명작 표지가 수채화→파스텔→3D→펜화로 변신 | "동화책 그림체가\n하나일 필요 있어요?" | 크로스페이드 모핑, 비트 4컷. 자산: `strategy-samples/style-01..10` |
| 2 명작 | 3–7s | 명작 표지 콜라주 빠른 컷 | "세계 명작동화,\n탱고북에서" | CoverSlide + Ken Burns, 0.4s 컷. 자산: `strategy-samples/cover-*` + R2 라이브러리 표지 |
| 3 한/영 | 7–10s | 같은 페이지 한글 ↔ English 토글 | "한 권으로\n한글 + 영어" | 텍스트 스왑 애니. 자산: 앱 화면 캡처 |
| 4 파닉스 | 10–14s | LetterFillCanvas — 글자 따라 쓰면 안이 칠해짐 (영 'A' + 한 'ㄱ') | "한글·영어\n파닉스까지" | 실제 채점 화면 캡처 + stroke 애니 |
| 5 자연관찰 | 14–17s | 자연관찰 그림책 비주얼 | "자연관찰 그림책도" | KenBurnsSlide. 자산: nature 카테고리 / R2 |
| 6 클로징 | 17–22s | 호리 마스코트 celebrating + 로고 | **"오픈베타 무료"** / "지금 무료로 보기 👇" | Hori Lottie(`mascot/hori/celebrating.json`) + SparkleParticles + EndingSlide |

**메시지 우선순위**: 그림체 다양성 → 명작 라인업 → 한/영 → 파닉스 → 자연관찰 → **무료**.

## 4. 자산 소스
- **repo 내장 (즉시 사용)**: `packages/client/public/strategy-samples/` — 그림체 10종(`style-01..10`), 명작 표지(`cover-cinderella`, `cover-snow-white`, `cover-red-riding-hood`, `cover-ugly-duckling`, `cover-nutcracker`, `cover-jack-beanstalk`, `cover-hare-tortoise`, `cover-ant-grasshopper`), 일러스트 샘플. 호리 마스코트 `public/mascot/hori/*`
- **R2 라이브러리 (선택, dev 서버 경유)**: `pnpm dev` → `GET /api/storybooks` 로 실제 211권 표지 URL 확보 → 다양한 그림체/한·영 표지 보강
- **앱 화면 캡처 (씬 3·4)**: dev 서버 + preview 도구로 한/영 토글 화면, LetterFillCanvas(`/letter-fill-demo`) 화면 스크린샷

## 5. 기술 — Remotion
- 위치: `packages/remotion/src/`
- **재사용 컴포넌트**: `CoverSlide`, `KenBurnsSlide`, `TypewriterSubtitle`, `SparkleParticles`, `EndingSlide`, `RunningDog`
- 신규: `ReelsPromo` composition (`compositions/ReelsPromo.tsx`) — 6개 씬 시퀀스(`<Series>` 또는 `<Sequence>`)
- `Root.tsx` 에 `<Composition id="ReelsPromo" width={1080} height={1920} fps={30} durationInFrames={660}>` 등록
- 이미지는 `staticFile()` 로 로드 → 영상에 쓸 자산은 `packages/remotion/public/` 로 복사 또는 심볼릭
- BGM: 저작권 free 트랙 placeholder (사용자가 최종 트랙 교체). `<Audio>` 로 삽입
- 렌더: `npx remotion render ReelsPromo out/reels-promo.mp4`

## 6. 범위 밖 (YAGNI)
- 실사 촬영 / 배우 / 나레이션 녹음
- 다국어 자막 버전(우선 한국어 1종)
- A/B 변형 다수 (1차는 단일 버전)

## 7. 산출물
1. 스토리보드/스펙 (이 문서)
2. Remotion `ReelsPromo` composition → 렌더된 `reels-promo.mp4` (9:16, ~22s)
