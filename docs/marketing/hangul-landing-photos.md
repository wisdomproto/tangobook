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
| `hero.webp` | ① 히어로 **우측 열**(md+) | 420×280 · **라이브러리 화면 합성** |
| `problem.webp` | ② 문제 제기, 두 번째 문단 뒤 | 768×580 |
| `tracing.webp` | ③ 「ㄱ 단원」 헤더 아래 **전체 폭** | 718×479 · **진짜 앱 화면 합성** |
| `siblings.webp` | ④ 파닉스 커리큘럼 끝 | 768×512 |
| `reading.webp` | ⑤ 「혼자 봅니다」 바로 뒤 | 768×576 · **뷰어 화면 합성** |
| `bedtime.webp` | ⑤ 「재울 때 씁니다」 바로 뒤 | 768×432 |
| `parent.webp` | ⑦ 베타 안내, CTA 박스 앞 | 768×580 |

🔴 **히어로는 옆에 두지 아래에 두지 않는다**(데스크탑) — 3:2 라 768px 폭이면 높이가 512px 이
되어 CTA 가 접힘선 밑으로 밀린다. 모바일은 1열이라 어차피 CTA 아래로 가는데, 그건 CTA 를
먼저 보여주므로 오히려 맞다.

## 🖥 태블릿 화면에 진짜 앱 화면 합성 (2026-08-02)

사용자 지적: 「이미지들에 우리 제품 화면이 아예 없으니까 이상하네」. 맞다 — 태블릿이 전부
빈 채로 빛나서 스톡 사진처럼 읽혔다.

도구 = `packages/server/scripts/composite-screen-into-photo.mjs`
(ImageMagick `-distort Perspective` + sharp. 새 의존성 없음.)

```bash
# 1) 화면 네 귀퉁이 찾기 — 열마다 「켜진 화면」 픽셀의 위·아래 경계를 찍어 준다
node packages/server/scripts/composite-screen-into-photo.mjs --probe <photo.png>

# 2) 합성 (quad = 스크린샷의 좌상·우상·우하·좌하가 갈 자리)
node packages/server/scripts/composite-screen-into-photo.mjs \
  <photo.png> <screenshot.png> out.png '[[-199,864],[650,698],[1080,795],[400,1023]]' 1.0
```

- 🔴 **AI 에게 화면을 그리게 하지 않는다.** 앱을 실제로 띄워 찍은 스크린샷을 원근 변환해 얹는다.
  가짜 화면이 우리 화면인 척하면 안 되고, AI 는 한글 글자를 깨뜨린다.
- 🔴 **손·손가락 오려내기를 손으로 하지 않는다.** 「켜진 화면」 픽셀만 남긴 마스크를 워프
  알파에 곱하면 손가락·베젤·둥근 모서리·반사가 저절로 위에 남는다.
- 🔴 **UI 를 그냥 얹으면 스티커로 보인다.** 원본 화면을 `soft-light` 로 다시 덮어 번들거림과
  빛 감쇠를 되살린다.
- 🔴 **플레이트(비워 둔 회색 화면)는 임계값으로 못 딴다** — 회색 소파·커튼이 같은 색이라
  마스크가 방 절반을 먹는다. `--seed x,y` 로 **화면 안 한 점에서 색으로 번져 나가면**
  붙어 있지 않은 소파엔 애초에 닿지 않는다.
- ⚠️ **첫 여섯 장 중에는 `tracing` 한 장만 가능했다.** 나머지는 태블릿 화면 면이 카메라를
  향하지 않는다 — 히어로·베타 부모는 화면이 반대쪽, 재우기는 뒤판, 형제는 거의 옆날.
  기하학의 문제라 편집으로 못 만든다. → 아래 플레이트로 히어로·읽기 두 장을 새로 받았다.

### 🔴 플레이트를 뽑을 때 가장 잘 틀리는 것 — **아이가 화면 뒤에 서면 안 된다**

「화면이 카메라를 향한다」와 「아이들이 마주 앉아 본다」를 같이 시키면, 아이가 **화면 뒤에서
앞면을 가리키는** 그림이 나온다(2026-08-02 형제 컷이 그랬다). 아이 쪽은 뒤판이라 볼 수 없는
걸 가리키는 셈이라 눈이 먼저 안다.

**해법 = 카메라를 아이와 같은 편에 둔다.** 어깨 너머로 찍거나(혼자 보는 컷), 어른이 태블릿을
**바깥으로 돌려 보여 주는** 자세로(히어로 컷). 실제로 성공한 두 장이 정확히 그 둘이다.

### 화면을 더 넣고 싶으면 — 「합성용 플레이트」로 새로 뽑는다

**화면 면이 카메라를 향하고, 화면 안이 비어 있는** 컷을 받으면 그 자리에 진짜 앱 화면을
넣을 수 있다. 아래 셋은 그대로 복사해 쓰는 **전문**이다(공통 스타일·비율 포함).

공통 규칙 — 세 장 다 해당:

- 🔴 화면 **네 귀퉁이가 전부 프레임 안**에 있어야 한다. 하나라도 잘리면 합성할 면이 안 나온다.
- 🔴 화면 안은 **완전히 비어 있어야** 한다(`COMPLETELY BLANK light-grey`). 뭐라도 그려 놓으면
  그걸 지우는 일이 먼저 생긴다.
- 🔴 유리에 강한 반사가 있으면 그 부분이 마스크에서 빠져 **UI 에 구멍**이 난다.
- 🔴 손이 화면을 **가로지르면 안 된다** — 마스크가 화면을 두 조각으로 갈라 UI 가 끊긴다.
  짚는 손은 가운데나 아래 모서리 근처로.

#### 1. 히어로 대체 — 엄마와 아이 (3:2)

```
Photorealistic lifestyle photograph in a 3:2 landscape aspect ratio (wide,
1536x1024). Korean family, natural window light, warm cream and soft peach
tones, shallow depth of field, 50mm lens look, candid documentary feel — NOT a
stock photo, no posed smiles at camera, no visible brand logos, no watermarks.
Clean modern Korean apartment interior. Muted warm palette: cream #FFF9F3,
soft peach #FFF0E0, gentle coral accents.

A Korean mother in her early 30s and her 5-year-old daughter sitting close
together on a beige living-room sofa. The mother holds a tablet tilted back
toward the camera so the whole screen is visible; the child leans in and
points at the middle of it with her index finger, mouth slightly open as if
sounding out a letter. The mother watches the child's face, not the screen,
with a small quiet smile. Morning light from a large window on the left.

The tablet screen faces the camera at a gentle angle so the full screen
rectangle is visible and unobstructed — all four corners of the screen within
frame, nothing overlapping them. The screen displays a COMPLETELY BLANK flat
light-grey surface: no text, no icons, no images, no reflections across the
glass. Natural room light, no harsh glare on the screen.
```

🔴 엄마 시선은 화면이 아니라 **아이 얼굴**에 — 이 페이지가 파는 게 「아이가 스스로 한다」다.

#### 2. 아이 혼자 (4:3)

```
Photorealistic lifestyle photograph in a 4:3 landscape aspect ratio (1400x1050).
Korean family, natural window light, warm cream and soft peach tones, shallow
depth of field, 50mm lens look, candid documentary feel — NOT a stock photo, no
posed smiles at camera, no visible brand logos, no watermarks. Clean modern
Korean apartment interior. Muted warm palette: cream #FFF9F3, soft peach
#FFF0E0, gentle coral accents.

A 5-year-old Korean child sitting cross-legged on a light rug, absorbed in a
tablet propped on a low stand in front of them. Shot from slightly above and
behind the child's shoulder, so the camera looks down onto the screen. The
child's face is in profile, calm and focused, not looking at the camera. Warm
late-afternoon light from a window on the right.

The tablet screen faces the camera at a gentle angle so the full screen
rectangle is visible and unobstructed — all four corners of the screen within
frame, not covered by the child's hand or head. The screen displays a
COMPLETELY BLANK flat light-grey surface: no text, no icons, no images, no
reflections across the glass. Natural room light, no harsh glare on the screen.
```

🔴 아이 머리가 화면 위쪽을 덮지 않게 — 「slightly above and behind the shoulder」가 그 장치다.

#### 3. 형제·자매 (3:2)

```
Photorealistic lifestyle photograph in a 3:2 landscape aspect ratio (wide,
1536x1024). Korean family, natural window light, warm cream and soft peach
tones, shallow depth of field, 50mm lens look, candid documentary feel — NOT a
stock photo, no posed smiles at camera, no visible brand logos, no watermarks.
Clean modern Korean apartment interior. Muted warm palette: cream #FFF9F3,
soft peach #FFF0E0, gentle coral accents.

Two Korean siblings, about 4 and 7, sitting side by side on a rug, sharing one
tablet propped upright between them and turned toward the camera. The younger
one reaches toward the lower corner of the screen; the older one waits,
watching. Both seen from the front and slightly above, faces three-quarter to
camera. Warm natural light from a window behind them creating a soft rim.

The tablet screen faces the camera at a gentle angle so the full screen
rectangle is visible and unobstructed — all four corners of the screen within
frame, with neither child's hand crossing the screen's edges. The screen
displays a COMPLETELY BLANK flat light-grey surface: no text, no icons, no
images, no reflections across the glass. Natural room light, no harsh glare on
the screen.
```

🔴 손은 **아래 모서리 근처**만 — 두 아이 손이 화면을 가로지르면 UI 가 끊긴다.

## 넣을 때 규칙

- **폭**: 랜딩 본문 컨테이너가 `max-w-3xl`(768px)이라 **1536px 이상**으로 받아 `w768 webp` 로 구워
  쓴다(표지·블로그 삽화와 같은 방침). 원본을 그대로 깔면 한 화면이 몇 MB 다.
- **자리**: 체험 상자(뷰포트 폭) 사이사이에 사진이 들어가면 리듬이 생긴다. 지금은 상자가 열 개
  연달아 있어 스크롤이 단조롭다.
- **캡션을 달지 않는다.** 캡션이 붙는 순간 주장이 되고, 주장이 붙으면 후기처럼 읽힌다.
