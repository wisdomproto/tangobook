# `/hangul` 랜딩 사진 프롬프트 (2026-08-01)

> 대형 플랫폼 랜딩 실측 결과 다섯 페이지가 전부 사람 사진으로 채워져 있는데 우리 랜딩엔 사람이
> 0명이라 만든다. 생성은 사용자가 GPT 에서 한다.

## 🔴 지키는 선

- **후기 사진은 만들지 않는다.** 경쟁사는 얼굴 사진 + `mis***님` + 후기 문장을 붙이는데,
  우리는 그 후기가 없다. AI 얼굴에 후기를 붙이면 **없는 고객을 지어내는 것**이다.
  여기 프롬프트는 전부 **분위기·맥락**이고, 화면에 사람 이름·평점·인용을 함께 두지 않는다.
- **화면 속 UI 를 그리지 않는다.** 프롬프트마다 「화면은 안 보이거나 빛만」을 넣었다.
  AI 가 만든 가짜 앱 화면이 우리 실제 화면인 척하면 안 되고, 한글 글자도 깨져 나온다.
  진짜 화면은 랜딩에 이미 **살아서 돌고 있다**(활동 9개 + 동화책).
- **로고·브랜드 없음.** 태블릿·폰에 사과 마크 같은 게 찍히면 못 쓴다.

## 공통 스타일 (모든 프롬프트 앞에 붙일 것)

```
Photorealistic lifestyle photograph, Korean family, natural window light,
warm cream and soft peach tones, shallow depth of field, 50mm lens look,
candid documentary feel — NOT a stock photo, no posed smiles at camera,
no text or UI visible on any screen (screen off or showing only soft glow),
no visible brand logos, no watermarks. Clean modern Korean apartment interior.
Muted warm palette: cream #FFF9F3, soft peach #FFF0E0, gentle coral accents.
```

---

## 1. 히어로 — 엄마와 아이가 같이 본다

**자리**: 히어로 우측(데스크탑) / 헤드라인 아래(모바일) · **3:2 가로**

```
A Korean mother in her early 30s and her 5-year-old daughter sitting close
together on a beige living-room sofa, both looking down at a tablet resting
on the mother's lap. The child is pointing at the screen with her index
finger, mouth slightly open as if sounding out a letter. The mother watches
the child's face, not the screen, with a small quiet smile. Morning light
from a large window on the left. Screen is angled away from camera so its
content is not visible — only a soft warm glow on their faces.
```

🔴 **엄마가 화면이 아니라 아이 얼굴을 본다** — 이 페이지가 파는 게 「아이가 스스로 한다」라서,
엄마의 시선이 아이에게 있어야 그 얘기가 된다.

---

## 2. 문제 제기 — 글자는 뗐는데 읽을 게 없다

**자리**: ② 「글자를 뗐는데 읽을 게 없으면, 금방 잊습니다」 · **4:3 가로**

```
A 6-year-old Korean child sitting alone at a low table, chin resting on one
hand, looking away from a stack of worksheet-style paper booklets in front
of them. Slightly bored, not sad — the look of a child who has finished
something and has nothing next. Soft afternoon light. The paper is plain
and generic with no readable text. Empty bookshelf visible behind, softly
out of focus.
```

🔴 **슬프면 안 된다** — 죄책감을 파는 광고가 되면 부모가 방어한다. 「할 게 없어서 멈춘 아이」다.
🔴 뒤 책장이 **비어 있는 것**이 이 컷의 논지다(읽을 게 없다).

---

## 3. 파닉스 — 손가락으로 글자를 쓴다

**자리**: ③ 「ㄱ 단원을 통째로 열어 두었습니다」 도입 · **1:1 정사각**

```
Close-up of a small child's hand, index finger extended, tracing a shape on
a tablet screen held flat on a wooden table. Only the hand, wrist and part
of the forearm in frame — no face. The screen shows only a soft warm glow,
no visible content. Shallow focus on the fingertip. Warm cream tones,
natural light from above.
```

🔴 **얼굴 없이 손만** — 바로 아래에 진짜 쓰기 활동이 붙으므로, 사진은 「손으로 쓴다」는
동작만 전하고 화면은 실물에 양보한다.

---

## 4. 동화책 — 재울 때 틀어둔다

**자리**: ⑤ 동화책 섹션 · **16:9 가로**

```
Dim bedroom at night, warm low lamp light. A 5-year-old Korean child lying
on their side in bed under a light blanket, eyes half-closed, listening. A
tablet is propped upright on the nightstand at a slight angle, screen facing
the child so the camera sees only its edge and a soft glow. No parent in
frame. Quiet, calm, sleepy mood. Deep warm shadows, cozy.
```

🔴 **부모가 프레임에 없다** — 「묶어 보기」의 쓰임이 *부모가 손을 떼는 것*이라 그게 그림이어야
한다. 재우는 장면이니 톤은 어둡게 가되 따뜻하게.

---

## 5. 베타 안내 — 마음이 놓인 부모

**자리**: ⑦ 「가입하면 1년 동안 무료입니다」 · **4:3 가로**

```
A Korean mother in her mid-30s sitting at a kitchen table with a mug of tea,
glancing across the room toward her child who is absorbed in a tablet on the
floor. The mother is relaxed, leaning back slightly, half-smiling. The child
is small in frame, back to camera, cross-legged. Late afternoon light. The
tablet screen is not visible to camera. Ordinary weekday calm.
```

🔴 **아이가 작게, 부모가 크게** — 이 섹션은 결제 결정을 하는 부모에게 하는 말이라
시선의 주인이 부모여야 한다.

---

## 6. (선택) 형제·자매

**자리**: 숫자 섹션 근처 · **3:2 가로**

```
Two Korean siblings, about 4 and 7, sitting shoulder to shoulder on a rug,
sharing one tablet placed between them. The younger one reaches toward the
screen; the older one waits, watching. Both in profile. Warm natural light
from a window behind them creating a soft rim. Screen content not visible.
```

⚠️ 「형제가 같이 쓴다」는 프로필 기능이 실제로 있으니 거짓이 아니다. 다만 없어도 되는 컷이라
다섯 장을 먼저 보고 판단.

---

## ✅ 배치 완료 (2026-08-02)

여섯 장 다 받아서 `packages/client/public/landing/hangul/*.webp` 로 구웠다(w800~1200 webp,
원본 3~4MB PNG → **합계 198KB**). 랜딩 컴포넌트 = `HangulLandingPage.Photo`.

| 파일 | 자리 | 화면 |
|---|---|---|
| `hero.webp` | ① 히어로 **우측 열**(md+) | 420×280 / 모바일은 CTA 아래 358×239 |
| `problem.webp` | ② 문제 제기, 두 번째 문단 뒤 | 768×580 |
| `tracing.webp` | ③ 「ㄱ 단원」 헤더 우측(sm+) | 160×160 |
| `siblings.webp` | ④ 파닉스 커리큘럼 끝 | 768×512 |
| `bedtime.webp` | ⑤ 「재울 때 씁니다」 바로 뒤 | 768×432 |
| `parent.webp` | ⑦ 베타 안내, CTA 박스 앞 | 768×580 |

🔴 **히어로는 옆에 두지 아래에 두지 않는다**(데스크탑) — 3:2 라 768px 폭이면 높이가 512px 이
되어 CTA 가 접힘선 밑으로 밀린다. 모바일은 1열이라 어차피 CTA 아래로 가는데, 그건 CTA 를
먼저 보여주므로 오히려 맞다.

## 넣을 때 규칙

- **폭**: 랜딩 본문 컨테이너가 `max-w-3xl`(768px)이라 **1536px 이상**으로 받아 `w768 webp` 로 구워
  쓴다(표지·블로그 삽화와 같은 방침). 원본을 그대로 깔면 한 화면이 몇 MB 다.
- **자리**: 체험 상자(뷰포트 폭) 사이사이에 사진이 들어가면 리듬이 생긴다. 지금은 상자가 열 개
  연달아 있어 스크롤이 단조롭다.
- **캡션을 달지 않는다.** 캡션이 붙는 순간 주장이 되고, 주장이 붙으면 후기처럼 읽힌다.
