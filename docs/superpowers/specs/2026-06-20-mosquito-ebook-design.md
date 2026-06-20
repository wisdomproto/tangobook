# 모기 그림책 인터랙티브 이북 — 설계 문서

- **작성일**: 2026-06-20
- **상태**: 설계 승인 완료, 구현 계획 작성 중
- **유형**: 단발성 콘텐츠 (범용 기능 아님)
- **개정(2026-06-20)**: 1차 범위를 **한국어·일본어**로 변경(페르시아어는 향후 확장). 일본어는 원본이라 `narration.jp`·`imageText.jp`가 이미 추출돼 있고 Gemini TTS가 한·일을 지원 → **Phase 0(페르시아어 TTS 검증)·RTL 처리·`SUPPORTED_LANGUAGES`에 `fa` 추가는 1차에서 제외**(`ja`는 이미 존재). 깨끗한 이미지 31장 수령 완료(`모기의_항변_추출/images2/`, `page 1.png`~`page 31.png`). 아래 본문에서 "페르시아어/fa"는 1차에서 "일본어/ja"로 치환해 읽는다.

## 1. 개요

일본 그림책 **「모기의 항변(蚊のいいぶん)」**(채식·생명존중 우화, 전 31페이지)을 **한국어·페르시아어 인터랙티브 웹 이북** + **언어별 mp4 영상**으로 제작한다. 독자가 페이지를 넘기면 그 장면에서 만화톤 애니메이션과 TTS 낭독이 재생되는 형태.

## 2. 배경 / 현재 자산

- 원본은 3개국어(일/한/페) 대역 단일 HTML(base64 이미지 31장 내장)로 제공됨.
- 추출 완료(`Documents/카카오톡 받은 파일/모기의_항변_추출/`):
  - `images/page01~31.jpg` — 글자가 박힌 원본 그림
  - `모기의_항변.json` — 페이지별 `narration{ko,fa}` + `imageText[]`(의성어/키워드/제목/도표라벨, type·jp·ko·fa 분리)
  - `이미지속글자.txt` — 이미지 속 글자 3개국어 모음
- **사용자가 글자를 모두 제거한 깨끗한 이미지 31장을 새로 제공할 예정.**

## 3. 목표 / 비목표

### 목표
- 독자가 페이지를 넘기며 보는 **인터랙티브 웹 이북**(링크 공유 가능, 탱고북 라우트)
- **언어 토글(한/페)** — 선택 언어로만 자막+낭독, 한 언어 몰입
- 의성어·의태어·제목·키워드·도표라벨을 **이미지 위 텍스트 오버레이 + 만화톤 애니메이션**으로 표현
- 나레이션은 **하단 자막 + TTS 낭독**
- **언어별 mp4 영상**(웹과 동일한 Remotion 컴포지션으로 렌더)

### 비목표 (YAGNI)
- 범용 이북 생성 틀/저작도구 기능 ❌ (모기 한 권 전용, 단발)
- 일본어 낭독·자막 ❌ (원본 언어는 노출하지 않음)
- 탱고북 메인 라이브러리 편입 ❌ (4-5세 유아 동화와 톤이 다른 우화 → 별도 라우트, 메뉴 비노출)

## 4. 확정 결정 사항

| 항목 | 결정 |
|------|------|
| 결과물 | 인터랙티브 웹 이북 + 언어별 mp4 |
| 범위 | 모기 한 권만 (단발) |
| 애니메이션 톤 | 생동감 있는 만화톤 (의성어 팝업 등) |
| 언어 | 한국어 / 페르시아어 토글 (한 언어 몰입) |
| 이미지 | 글자 전부 제거한 깨끗한 그림 (사용자 제공) |
| 이미지 글자 | 의성어·의태어·제목·키워드·도표라벨 **전부** 오버레이 텍스트 레이어로 |
| 나레이션 | 하단 자막 + TTS |
| 엔진 | Remotion (웹 = `@remotion/player`, 영상 = `renderMedia`) |
| 배포 | 탱고북 클라 전용 라우트 `/ebook/mosquito` (메인 메뉴 비노출) |

## 5. 데이터 모델

단일 JSON이 웹과 영상을 모두 구동한다. 추출된 JSON을 다음 구조로 확장:

```jsonc
{
  "title": { "ko": "모기의 항변", "fa": "پاسخِ پشه" },
  "languages": ["ko", "fa"],
  "pages": [
    {
      "page": 9,
      "image": "clean/page09.png",            // 글자 제거한 깨끗한 그림
      "narration": { "ko": "...", "fa": "..." }, // 하단 자막 + TTS 대본
      "tts":       { "ko": "audio/ko/p09.mp3", "fa": "audio/fa/p09.mp3" },
      "overlays": [                            // 이미지 위 텍스트 전부
        {
          "id": "sfx1",
          "kind": "의성어",                    // 의성어|키워드|제목|라벨
          "text": { "ko": "뜨끔", "fa": "یکّه!" },
          "x": 0.14, "y": 0.42,               // 이미지 상대 좌표(0~1)
          "anim": "drop",                      // drop|pop|shake|fade
          "delay": 0.3,                        // 등장 지연(초)
          "style": { "size": "lg", "color": "#c0392b", "rotate": -6 }
        }
      ]
    }
  ]
}
```

- **오버레이 좌표/스타일 초기값은 Claude가 원본(글자 박힌) 이미지를 보고 추정해 채운다.** 깨끗한 이미지에 동일 좌표로 얹히므로 사용자가 좌표를 지정할 필요 없음(미세조정만).
- `overlays`는 추출된 `imageText[]`에서 1:1 파생 + 좌표/애니 메타 부가.
- **경로 규약**: `image`·`tts`는 모두 **R2 public 절대 URL**(기존 Remotion `<Img>`/`<Audio>`가 절대 URL을 소비). 깨끗한 이미지·생성 TTS는 R2 업로드 후 URL로 연결한다(상대 경로 아님).
- **단일 소스(Single source of truth)**: canonical 데이터는 `packages/remotion/src/data/mosquito.ts` **한 곳**. 추출 JSON(`모기의_항변.json`)은 이를 생성하는 1회성 입력일 뿐 런타임에서 참조하지 않는다(복사본 드리프트 방지).

## 6. 아키텍처 / 컴포넌트

```
packages/remotion/src/
  compositions/MosquitoEbookComposition.tsx   # 메인 컴포지션 (lang prop)
  components/ebook/
    EbookPage.tsx          # 페이지 1장: 그림 + 오버레이 + 자막 + 오디오
    OverlayText.tsx        # 의성어/키워드 오버레이 + anim 분기
    Subtitle.tsx           # 하단 자막 (RTL 대응)
  data/mosquito.ts         # 위 JSON 로드/타입

packages/client/src/features/ebook-mosquito/   # 단발 전용 모듈
  pages/MosquitoEbookPage.tsx   # @remotion/player 임베드 + 네비 + 언어 토글
  api/ (필요 시 TTS/asset URL)

packages/server/scripts/
  mosquito-tts.mjs         # 한/페 TTS 일괄 생성 → R2
```

- **재사용**: `KenBurnsSlide`(은은한 줌/팬), 오디오북 `renderMedia` 렌더 인프라, TTS provider.
- **신규**: `OverlayText`(애니 분기), `Subtitle`(RTL), 이북 Player 래퍼.
- **컴포지션 인터페이스**: `MosquitoEbookComposition`은 `{ pages: Page[], lang }`를 받아 전 페이지를 `<Sequence>`로 배치한 **단일 타임라인**이다. mp4는 이 타임라인 전체를 렌더하고, 웹 Player는 같은 컴포지션을 임베드하되 현재 페이지의 `<Sequence>` 구간으로 **seek**해 그 구간만 재생한다(페이지 넘김 = 타임라인 seek). 컴포지션을 페이지별로 쪼개지 않는다.

## 7. Remotion 컴포지션 상세

- 페이지 = `<Sequence>`; `lang`(ko|fa) prop으로 텍스트·오디오 스위치.
- **그림**: `KenBurnsSlide`로 느린 줌/팬.
- **오버레이 애니** (`anim`별):
  - `drop` — 위에서 덜컥 떨어지며 바운스 (충격/의성어)
  - `pop` — 작게→크게 통통 튀어 등장 (키워드)
  - `shake` — 등장 후 부르르 흔들림 (강조)
  - `fade` — 부드러운 페이드 (제목/라벨)
  - 종류는 페이지 분위기에 따라 Claude가 지정.
- **자막**: 하단 고정, `narration[lang]`. 페이지 진입 시 페이드 인.
- **TTS**: `<Audio src=tts[lang]>`. 자막은 페이지 진입 시 페이드 인, **낭독은 기존 오디오북 패턴대로 ~0.67초(20프레임) 지연 후 시작**(즉시 재생의 어색함 방지). 페이지 길이 = 지연 + TTS 길이 + 1.5초 패딩(`useTtsDurations` 패턴).
- **RTL**: 페르시아어는 자막 `direction: rtl`, 오버레이 텍스트 우측 기준 정렬.

## 8. 웹 이북 UI

- 라우트 `/ebook/mosquito` (AppShell 밖 풀스크린, 메인 메뉴 비노출).
- `@remotion/player`로 현재 페이지 컴포지션 재생.
- 컨트롤: 이전/다음, 페이지 인디케이터, **언어 토글(한/페)**, 다시듣기.
- 페이지 진입 시 애니+TTS 자동재생. 마지막 페이지 후 처음으로/공유 안내.
- 모바일(태블릿/폰) 대응.

## 9. mp4 렌더링

- 동일 `MosquitoEbookComposition`을 `lang`별로 `renderMedia` → `모기_ko.mp4`, `모기_fa.mp4`.
- 기존 오디오북 렌더 파이프라인(`packages/remotion` entry, Chromium 설정) 재사용.
- 페이지 길이는 TTS 길이 + 패딩으로 자동 산출(`useTtsDurations` 패턴 참고).

## 10. TTS 파이프라인

- **한국어**: Gemini TTS(`gemini-2.5-flash-preview-tts`, 검증됨).
- **페르시아어**: Gemini 페르시아어 지원이 공식 목록에 불명확 → **Phase 0에서 샘플 2~3페이지 검증**:
  - 품질 양호 → Gemini로 전량 생성
  - 미흡 → ElevenLabs provider 추가(신규 구현 + 키/비용) **또는** "페르시아어는 자막만(낭독 생략)"으로 폴백
- `SUPPORTED_LANGUAGES`(shared)에 `{ code:'fa', label:'페르시아어', nativeName:'فارسی', flag:'🇮🇷' }` 추가(RTL 첫 사례).
- 생성 오디오는 R2 저장, 데이터 모델 `tts` 경로에 연결.

## 11. 작업 흐름 (Phase)

- **Phase 0 — 페르시아어 TTS 검증 + fa 언어 등록**: 리스크 먼저 제거.
- **Phase 1 — 데이터 구조화**: 추출 JSON → 이북 데이터 모델 변환, 오버레이 좌표/애니 메타 채움(원본 이미지 기반).
- **Phase 2 — Remotion 컴포지션**: EbookPage/OverlayText/Subtitle, 애니, RTL, TTS 싱크.
- **Phase 3 — 웹 이북 UI**: Player 래퍼, 네비, 언어 토글, 자동재생. **개발용 좌표 디버그 토글**(오버레이 좌표 그리드를 그림 위에 표시)을 넣어 §5 좌표 미세조정 루프를 추측-재렌더가 아닌 눈으로 확인·조정 가능하게 한다.
- **Phase 4 — mp4 렌더**: 언어별 출력 검증.

### 작업 분담
| 사용자 | Claude |
|--------|--------|
| 깨끗한 이미지 31장(글자 제거) 제공 | 데이터 구조화 + 오버레이 좌표/애니 |
| (선택) 페르시아어 번역 검수 | Remotion 컴포지션·웹 UI·TTS·mp4 |

## 12. 리스크 / 미해결

| 리스크 | 대응 |
|--------|------|
| 페르시아어 TTS 품질 | Phase 0 샘플 검증 → Gemini/ElevenLabs/자막만 분기 |
| 오버레이 좌표 정확도 | 원본 이미지 기반 추정 초기값 + 프리뷰로 미세조정 |
| 깨끗한 이미지 톤/해상도 일관성 | 사용자 제공물 수령 후 점검, 필요 시 보정 가이드 |
| 페르시아어 RTL 첫 도입 | 자막/오버레이 정렬 별도 검증, 숫자는 일반 숫자 유지(추출 시 적용 완료) |

## 13. 테스트 / 검증

- Remotion 프리뷰에서 페이지별 애니·자막·오디오 싱크 확인.
- 언어 토글 시 텍스트·오디오·RTL 정상 전환.
- mp4 언어별 출력(영상 길이, 오디오 동기) 확인.
- 웹 Player 페이지 네비/자동재생/모바일 레이아웃.
- 페르시아어 샘플 청취 평가(Phase 0 게이트).

## 14. 향후 (이번 범위 밖)

- 다른 책으로의 일반화(틀화)는 필요해지면 별도 스펙.
- 일본어/추가 언어, BGM 큐레이션, 공유용 OG 이미지 등은 후속 옵션.
