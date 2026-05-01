# 오디오북 모듈 (Remotion)

Remotion v4 기반 오디오북 영상 생성. Player 프리뷰 + 서버 렌더링.

## 렌더링 패턴

- **fire-and-forget** (컨트롤러 즉시 응답 → 클라이언트 폴링)
- Remotion entry: 프로덕션 절대경로 사용 (`/app/packages/remotion/src/entry.ts`)
- Chromium: Dockerfile에 `chromium`+`nss` 설치, `CHROMIUM_PATH` env로 전달
- `browserExecutable`: `selectComposition` + `renderMedia` 둘 다에 전달 필수

## BGM

- 라이브러리: 파일 업로드 시 `background-music.json` (R2) 자동 갱신
- 루프: Remotion `<Loop>` 컴포넌트 (`bgmDuration` prop 필요, 서버/클라 모두 probe)

## 자막/TTS 타이밍

- **크로스페이드**: 1초 (30 프레임)
- TTS/자막: 장면 전환 후 0.67초 딜레이
- TTS 종료 후 1.5초 패딩
- 자막 타이밍: 문장 글자수 비례 배분 (`TypewriterSubtitle.slideDurationInFrames`)

## boolean 기본값

`includeTts`/`includeSubtitles`/`includeCover`/`includeBgm` 은 `!== false`로 체크 (레거시 undefined 대응)

## TTS 길이 캐시

`hooks/useTtsDurations`: 모듈 레벨 `durationCache` Map으로 영구 캐시. `loading`은 파생 상태 — 컴포넌트 재마운트 시 stuck loading 방지.

## Remotion 패키지 (`packages/remotion/`)

```
remotion/src/
  types.ts                              # AudiobookRenderProps (Storybook에 독립적)
  compositions/AudiobookComposition.tsx # 메인 컴포지션
  components/                           # KenBurnsSlide, TypewriterSubtitle, SparkleParticles
  utils/                                # ken-burns.ts, duration.ts
  Root.tsx                              # Composition 등록 + calculateMetadata
  entry.ts                              # registerRoot() — 서버 bundle() 진입점
```

상세: [memory/remotion-audiobook.md](../../../../../memory/remotion-audiobook.md), [memory/rendering-migration.md](../../../../../memory/rendering-migration.md)
