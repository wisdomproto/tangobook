# strategy.html (Pitch Deck) — 작업 규칙

`packages/client/public/strategy.html` 슬라이드 작업할 때 매번 참조.
반복 지적된 사항을 모은 single source of truth. 새 슬라이드 만들거나 기존 슬라이드 수정 전에 이 파일 한 번 훑어보고 시작.

## 1. 헤더 패턴 통일 — 절대 규칙

모든 슬라이드 (§01 ~ §09) 헤더는 동일 패턴:

```html
<section id="...">
  <div class="section-badge {coral|mint|dark|purple|blue}">
    <span class="badge-num">{번호}</span>{영문 카테고리}
  </div>
  <h2 class="section-h2">...</h2>
  <div class="section-sub">...</div>  <!-- optional -->
  ...
</section>
```

규칙:
- 좌상단 chip · 좌정렬 H2 (`.section-h2` = 46px 기본) · 좌정렬 subtitle
- ❌ `text-align: center` 금지
- ❌ H2 `font-size` override 금지
- ✅ chip 색만 섹션 테마별로 변경 (color enum: coral/mint/dark/purple/blue)
- ✅ reference 이미지가 centered 여도 **좌정렬 통일 우선**

> 개별 슬라이드만 다른 정렬·사이즈로 만들면 그게 제일 보기 싫음.

현재 색 매핑 (필요 시 변경 OK):
- coral: §01 Market / §02 Problem / §04 Our Product / §05 Marketing / §06 Business / §08 Milestone
- mint: §03 Solution
- dark: §03A Proven Model
- purple: §07 Moat
- blue: §09 Financial

## 2. 자랑 표현 — 작은 숫자 노출 금지

지금 (베타 전) 단계 자산은 시장 기준 매우 작음. 자랑하면 오히려 약점 노출:

| 자랑 X | 자랑 O |
|---|---|
| 233권 동화책 | "검증된 시드 라이브러리" |
| 16+ 그림체 preset | "무한 그림체 자유도" (AI 시대 표준) |
| 9 카테고리 | (의미 없음) |
| 10대 학습 활동 | "학습 활동 통합 플랫폼" |

자랑할 거: **시스템·구조·차별화 포인트**, **시장 빈자리**, **검증된 모델 적용**

## 3. AI 모델 표현 — 멀티모달 스택

❌ "Gemini 3.1 Pro 사용" 처럼 한 모델만 적으면 한계 노출
✅ "멀티모달 AI 스택 — Gemini·Grok·Whisper · 영역별 최적"

업계 표준이 GPT + FLUX + Ideogram + Claude 등 다중 모델 조합. 우리도 멀티 (텍스트 Gemini / 영상 Grok / 음성 Whisper).

## 4. AI 동화책 플랫폼 — 진짜 selling point (2026 기준)

경쟁사 자랑 포인트 (Magical Hekaya / LoveToRead / Storybird / Inkfluence / Storique 등):
- 🎭 **캐릭터 일관성 보장** — 전 페이지 동일 캐릭터·옷·표정 (최대 페인포인트 해결)
- ⚡ **30초~30분 생성 속도**
- 🤖 **멀티모달 AI 스택** (영역별)
- 📤 **멀티 출력 포맷** — 디지털·오디오·인쇄·영상
- 🛡️ **COPPA-compliant 안전 검수**
- 🎨 **personalization** (아이 사진·이름 반영)

> preset 자유도 같은건 옛날 selling point. 캐릭터 일관성이 2026 최강 차별화.

## 5. 마케팅 채널 — YouTube 빠뜨리지 말 것

사용자가 가장 중요하게 보는 채널:
- 🎬 **YouTube** (Shorts·롱폼 자동 변환·업로드) ← 최우선
- 🌐 듀얼 블로그 (자체 + 네이버 동시)
- 🔍 SEO 인프라
- 📝 블로그·카드뉴스 자동
- 🧲 바이럴 자석

SEO·블로그만 적으면 빠진다. YouTube + 듀얼 블로그 항상 명시.

## 6. Reference 이미지 사용 원칙

사용자가 "이런 느낌으로" 보여주는 reference:
- ✅ **톤 · 콘텐츠 구조 · 색감 · 일러스트 스타일** 참고
- ❌ **통일 규칙 (header pattern · color tokens · CSS class)** 우선 깨면 안 됨

reference 가 centered 헤더 / 큰 H2 / 특수 정렬 보여줘도, deck 통일 규칙 (위 1번) 유지.

## 7. 슬라이드 추가/삭제 시

- ID 는 `section id="..."` — URL hash 와 동기화 (`#market`, `#solution` 등)
- 신규 슬라이드는 `02+`, `03A`, `03++` 같은 sub-numbering 으로 끼워넣어 후속 §04~§09 안 흔들기
- 색 매핑은 위 1번 참조

## 8. 자동 fit 고려

`fitSlide()` 가 `min(slideH/contentH, slideW/contentW, 1)` 으로 scale 자동 적용.
- 콘텐츠 많으면 scale ↓ → 텍스트 작아짐 (가독성 ↓)
- 슬라이드 한 장당 정보량 너무 욕심 X. 필수만.
- 현재 짧은 슬라이드 11개 / scale 적용 10개 (worst case 0.32)

## 자가 체크리스트 — slide 작업 시 매번

- [ ] 헤더 = `.section-badge` + `.section-h2` (좌정렬, no override) 인가?
- [ ] preset / 권수 같은 작은 숫자 자랑하고 있나? → 빼기
- [ ] AI 모델 한 개만 적었나? → 멀티모달로
- [ ] 캐릭터 일관성·멀티 출력 같은 진짜 차별화 들어갔나?
- [ ] 마케팅에 YouTube 들어갔나?
- [ ] reference 따라가다 통일 규칙 깨고 있나?
- [ ] 슬라이드 내용 너무 많아서 fitSlide scale 너무 작아지진 않나?

## 변경 이력

- 2026-05-28 — 초안 생성 (헤더 통일 · 233권 자랑 X · 멀티모달 · YouTube · reference 원칙)
