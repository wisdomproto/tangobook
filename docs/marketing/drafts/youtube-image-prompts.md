# 유튜브 채널 이미지 생성 프롬프트 (배너 + 워터마크)

> 대표님이 직접 나노바나나/GPT/미드저니 등 어디에 넣어도 되게 만든 범용 프롬프트.
> 만든 이미지를 주시면 검수해 드립니다. 브랜드 톤 = 니들펠트/따뜻한 그림책, 색 = coral·peach·cream, 마스코트 = 호리(아기호랑이).
> 로고 파일이 필요하면 `packages/client/public/logo/logo-kr.webp` 참조.

---

## 1. 채널 배너 (YouTube Channel Art)

**권장 사이즈**: 2560 × 1440 px (가로). 안전 영역 = 중앙 1546 × 423 px — **핵심 요소(카피·마스코트·로고)는 이 중앙 띠 안에** 둘 것(양옆·위아래는 기기에 따라 잘림).

### 프롬프트 (한국어 카피는 이미지에 넣지 말고, 만든 뒤 텍스트만 따로 얹는 걸 권장 — AI가 한글을 자주 깨뜨림)

```
A warm, cozy YouTube channel banner for a children's picture-book brand, 2560x1440 landscape, 16:9.
Style: soft needle-felted wool texture, gentle hand-crafted storybook illustration, pastel and warm.
Color palette: coral (#FF6B5E) accents, peach (#FFE3D3) and cream (#FFF8F0) backgrounds, soft mint touches.
Composition: keep all key subjects within the CENTER horizontal band (safe zone), leave the left/right and top/bottom edges as soft empty peach-cream gradient so nothing important gets cropped.
Left side: an adorable felted baby tiger mascot (round, friendly, big warm eyes, small stripes) sitting and holding an open picture book.
Around the center-right: floating cozy storybook motifs — a cute cartoon dinosaur, a ladybug, a crescent moon, a tiny open book, sparkles — arranged airy and uncluttered.
Lighting: soft, warm, diffuse, daylight nursery mood. Clean negative space in the center for text overlay.
No text, no letters, no logo, no watermark. High detail, wholesome, premium children's brand aesthetic.
```

### 만든 뒤 얹을 텍스트 (배너 중앙, 둥근 폰트)
- 메인: **아이와 함께 보는 명작동화 · 자연관찰 그림책**
- 서브: **공룡부터 신데렐라까지 · 광고 없이, 매일 새 이야기**
- 우하단 작게: **tangobook.co.kr · 7일 무료**

### 피해야 할 것
- 한글/영문 텍스트를 AI로 굽지 말 것(깨짐) → 텍스트는 캔바 등에서 별도로.
- 이미지 가장자리에 얼굴·글자 배치 금지(잘림).
- 차갑거나 형광·네온 색, 3D 실사, 무서운 공룡 톤 금지(따뜻·순한 톤 유지).
- 잡다하게 꽉 채우지 말 것 — 중앙에 여백 필요(텍스트 자리).

---

## 2. 구독 워터마크 (동영상 워터마크)

**권장 사이즈**: 정사각형 **300 × 300 px**, **투명 배경 PNG**. 영상 우하단에 아주 작게 뜨므로 **극단적으로 단순**해야 알아봄.

### 프롬프트

```
A minimal circular app-icon style logo mark on a fully TRANSPARENT background, PNG, square 300x300, centered.
Subject: a simple, friendly felted baby tiger face (or a tiny open book) icon — bold, rounded, high-contrast, instantly readable at very small size.
Color: coral (#FF6B5E) and cream, flat clean shapes, thick simple outlines, minimal detail.
Design like a modern sticker / app icon: one clear silhouette, generous internal spacing, no fine details that vanish when scaled down.
Transparent background (alpha), no square frame, no drop shadow, no text, no watermark, no gradient noise.
```

### 대안 (구독 버튼형)
```
A tiny "Subscribe" bell-style icon, coral rounded button, transparent background PNG 300x300, ultra-minimal, flat, thick shapes, readable at 40px. No text.
```

### 피해야 할 것
- 배경(흰/색) 절대 금지 → **반드시 투명(alpha)**. 안 그러면 영상 위에 네모가 뜸.
- 가는 선·작은 글씨·세밀한 무늬 금지(작게 뜨면 사라짐).
- 그림자·테두리 네모 프레임 금지.
- 여러 색·그라데이션 남발 금지(coral+cream 2톤 권장).

> 만든 워터마크는 스튜디오 → 맞춤설정 → 브랜딩 → 동영상 워터마크에 업로드, 표시 시점 "동영상 전체".
