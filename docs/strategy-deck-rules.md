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
- 16:9(1280×720) 기준 worst = market **0.712** (본문 실효 글자 ≥11px). scale 1.0 = hero·business·milestone·financial-revenue.
- 한 슬라이드에 텍스트 너무 많으면 scale ↓ → 발표 화면(1080p)에서도 작아짐. 정보량은 필수만.

## 9. 투자자 = 이 분야 zero-knowledge 가정 (논리·톤) — 2026-05-29 추가

투자자가 유아 교육·AI 동화·마켓플레이스를 **아예 모른다**고 가정하고 만든다. 아는 사람끼리 통하는 점프·단언·전문용어를 다 풀어쓴다.

### 9-1. 논리 전개 — 단언 X, 인과 O

- ❌ "시장이 작가를 발굴한다" 처럼 결론만 던지기
- ✅ **원인 → 결과**로 풀기: "진입 장벽을 없앴더니 → 숨어있던 작가가 쏟아졌고 → 시장이 고른 작품이 글로벌 IP로 컸다"
- 마켓플레이스(네이버웹툰형) 정체성은 닭-달걀 문제를 부른다. 항상 **순서를 명시**: "작가를 부르려면 부모가 먼저 있어야 한다 → 검증된 **seed 콘텐츠**로 부모를 모으고 → 그 위에 작가를 단계적으로 초대". seed 콘텐츠를 "우리가 직접 만든 책 자랑"으로 오해받지 않게, **부모 유입용 마중물**이라고 정체성을 박아둔다.
- 한 슬라이드에서 의문이 생기면(예: "작가는 어떻게 모으나?") 그 자리에서 **"뒤에서 설명합니다" parking note**를 달아 흐름을 끊지 않는다.

### 9-2. 용어 — 처음 나올 때 한 줄 풀이

| 용어 | 풀이 (deck 안에 박기) |
|---|---|
| 파닉스 | 글자와 소리를 연결해 아이가 스스로 읽는 법 |
| retention | 30일 후 재방문율 |
| SOM / 침투율 | 1차 시장 N억의 X% 점유 (숫자로 환산해서) |

전문용어 단독 노출 금지. 영어 약어는 한글 풀이 동반.

### 9-3. 톤 — 과신 표현 제거, 설계·목표 프레이밍

- ❌ "압도", "N배 우위" 단정, 경쟁사 직접 비교("Netflix보다")
- ✅ "SaaS 업계 평균(3배)보다 높게 **설계**", "30일 retention 18% **목표**" — 사실이 아니라 **설계/목표**임을 명시
- 아직 검증 안 된 재무·KPI엔 **⚠️ 가정 주의문**을 단다
- 매출 숫자는 **보수적 맥락**과 함께: "정식 매출 7.2억 = 1차 시장 5,000억의 0.2%도 안 되는 점유율만으로 나오는 숫자"처럼 침투율로 환산해 "욕심 안 부렸다"를 보여준다

## 자가 체크리스트 — slide 작업 시 매번

- [ ] 헤더 = `.section-badge` + `.section-h2` (좌정렬, no override) 인가?
- [ ] preset / 권수 같은 작은 숫자 자랑하고 있나? → 빼기
- [ ] AI 모델 한 개만 적었나? → 멀티모달로
- [ ] 캐릭터 일관성·멀티 출력 같은 진짜 차별화 들어갔나?
- [ ] 마케팅에 YouTube 들어갔나?
- [ ] reference 따라가다 통일 규칙 깨고 있나?
- [ ] 슬라이드 내용 너무 많아서 fitSlide scale 너무 작아지진 않나?
- [ ] (§9) 결론만 던지지 않고 원인→결과로 풀었나? 마켓플레이스면 seed→작가 순서 명시했나?
- [ ] (§9) 파닉스·retention·침투율 같은 용어 처음 나올 때 한 줄 풀이 달았나?
- [ ] (§9) "압도"·"N배" 단정·경쟁사 비교 대신 설계·목표 프레이밍 + 가정 주의문인가?

## 변경 이력

- 2026-05-28 — 초안 생성 (헤더 통일 · 233권 자랑 X · 멀티모달 · YouTube · reference 원칙)
- 2026-05-29 — §9 추가 (zero-knowledge 투자자 톤: 인과 전개·seed→작가 순서·용어 풀이·과신 표현 제거) + fitSlide worst 0.712 갱신
