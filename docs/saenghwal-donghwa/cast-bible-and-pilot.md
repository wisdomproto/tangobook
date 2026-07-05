# 호리네 생활동화 — 캐릭터 바이블 + 파일럿 1권

> 벤치마크(대발이 100화·페파·콩순이) 분석 기반. 생활동화 트랙은 **호리(아기 호랑이) 고정 앙상블** 캐릭터 기반.
> 명작·자연관찰은 기존 multi-그림체 유지(하이브리드). 아트 기준 = `docs/hori-sprite-prompts.md` BASE PROMPT.

---

## 1. 호리네 캐스트 바이블 (v1)

고정 8인 앙상블. **한 번 디자인 = 30~40권 재사용**.

| # | 이름 | 종 | 나이 | 성격 | 주로 쓰는 주제 | 외형 키 |
|---|---|---|---|---|---|---|
| 1 | **호리** | 아기 호랑이 | 5 | 호기심 많고 다정, 가끔 고집 | 거의 전권(주인공) | 주황 털+갈색 줄무늬, 크림 배, 분홍 볼터치 (기존 디자인) |
| 2 | **엄마** | 호랑이(엄마) | — | 다정·차분한 조력자(해결의 목소리) | 습관·감정 전반 | 호리와 같은 팔레트, 큰 키, 앞치마 |
| 3 | **아빠** | 호랑이(아빠) | — | 든든·장난기, 놀이친구 | 가족·자립·바깥활동 | 진한 주황, 짙은 줄무늬, 둥근 안경(선택) |
| 4 | **호야** | 아기 호랑이(동생) | 2 | 천진·따라쟁이 | 동생질투·배려·양보 | 호리 미니 버전, 턱받이, 더 큰 머리비율 |
| 5 | **토토** | 토끼 | 5 | 활발한 리더, 뭐든 먼저 도전 | 차례·용기·도전·친구 | 흰+연하늘 토끼, 긴 귀, 늘 앞장 |
| 6 | **보리** | 곰 | 6 | 수줍음·느긋·겁 많지만 다정 | 부끄러움·두려움·배려 | 연갈색 통통 곰, 멜빵바지, 큰 눈 |
| 7 | **콩이** | 다람쥐 | 5 | 먹보·장난꾸러기·호기심 | 편식·간식·요리·호기심 | 갈색 다람쥐, 볼주머니 빵빵, 큰 꼬리 |
| 8 | **두부** | 강아지(펫) | — | 충성·까불·졸졸 따라다님 | 동물·생명존중·책임 | 동글 흰 강아지, 갈색 귀 한쪽, 빨간 목줄 |

**성격 대비 설계 원칙(페파의 Suzy/Rebecca 원리):** 토토=앞서가는 아이 / 보리=느린·수줍은 아이 / 콩이=충동·먹보 아이 → 아이가 **"나는 ○○ 같아"** 자기 투영. 친구는 **서로 다른 종**이라 한 장면에 모여도 즉시 구분.

### 캐릭터 시트 생성 프롬프트 (Gemini, 매젠타 배경 = 스프라이트 파이프라인)

공통 스타일 앵커(모든 캐릭터에 포함):
```
Style: Needle-felted wool plush look — a soft handmade 3D wool-felt doll with visible fuzzy felted-wool fibers, chunky huggable rounded forms, gentle soft studio lighting, vibrant saturated colors, stop-motion feel. NOT flat 2D, NOT painted, NOT smooth CG, NOT clay-smooth (wool fibers must be visible). Super-deformed chibi: head ~1.3× body, short chubby limbs, 3-finger rounded paws, large round eyes with white highlights, pink cheek blush. Canvas 1024×1024, solid pure magenta #FF00FF background, character centered, 8% padding. No ground, no shadow, no text, no extra characters.
POSE: standing idle, front view, gentle smile, arms relaxed.
```
캐릭터별 교체 줄(`CHARACTER:`):
- **엄마**: `an adult mother tiger, same warm orange fur (#F8A755) and brown stripes (#5A3A22) and cream belly as Hori, taller and slender, kind half-closed eyes, wearing a soft peach apron.`
- **아빠**: `an adult father tiger, deeper orange fur, thicker brown stripes, broad friendly build, small round glasses, big warm smile.`
- **호야**: `a toddler baby tiger (Hori's little brother), same palette as Hori but even chubbier with a bigger head ratio, wearing a yellow bib, tiny, wobbly, drooly happy face.`
- **토토**: `a bouncy bunny rabbit, white fur with light-blue inner ears, long upright ears, bright confident eyes, energetic pose leaning forward, wearing a tiny red kerchief.`
- **보리**: `a chubby light-brown bear cub, shy gentle expression, big round eyes looking slightly down, wearing blue denim overalls, soft and slow-looking.`
- **콩이**: `a brown squirrel, big bushy striped tail, cheeks puffed full like storing food, mischievous grin, holding an acorn, lively.`
- **두부**: `a small round white puppy, one floppy brown ear, big shiny eyes, red collar, tongue out happy, sitting loyally.`

> 워크플로: 각 캐릭터 골든 idle 1장 확정 → 그걸 ref로 표정/포즈 시트 확장(호리 파이프라인과 동일). 배경 제거·후처리 = `docs/hori-sprite-prompts.md` 후처리 스크립트.

---

## 2. 파일럿 1권: 「골고루 먹으면 무지개 힘!」

- **주제**: 편식 / 골고루 먹기 (벤치마크 단일 최고 인기 — 대발이 83화 44만)
- **타겟 연령**: **3~5세** (핵심 밴드)
- **학습목표**: 채소를 거부하던 아이가 "색깔=힘"이라는 재미 프레임으로 한 입 도전 → 골고루 먹기 수용
- **등장**: 호리(편식 주인공) · 엄마(조력자) · 콩이(먹보 친구, 채소의 재미를 보여줌) · (단역 두부)
- **구조**: 검증된 5비트 아크 — 일상→문제→전환(친구·놀이)→해결(도전·성공)→자기수용+반복 후렴
- **반복 후렴(매 전환마다)**: *"골고루 냠냠, 무지개 힘이 쑥쑥!"*
- **분량**: 10 스프레드(페이지). 나레이터=3인칭 해요체 + 캐릭터 대사.

### 페이지별 텍스트 + 장면 프롬프트

장면 프롬프트 공통 앵커(모든 페이지 머리에 적용):
```
Needle-felted wool plush spread illustration (handmade felt stop-motion diorama). Soft 3D wool-felt characters with visible fuzzy felted-wool fibers, chunky rounded forms, gentle soft studio lighting, vibrant saturated colors; NOT flat 2D, NOT painted, NOT smooth CG. Characters are the fixed Hori cast (baby tiger Hori: warm orange fur #F8A755 with brown stripes, cream belly, pink cheek blush). Bright friendly palette, soft depth-of-field background. 16:9 spread, no text in image, leave calm negative space at top for caption.
SCENE:
```

**P1 — 일상(도입)**
- 텍스트: *"저녁이 되면 호리네 식탁은 좋은 냄새로 가득해요. 오늘 저녁은 알록달록, 색깔이 참 많아요. 그런데 호리는 하얀 밥이랑 고기만 콕콕 집어요."*
- SCENE: `Cozy evening dinner table at the tiger family home, warm lamp light. Baby tiger Hori sitting in a high-ish chair picking only white rice and meat with chopsticks, pushing a small pile of broccoli and carrots to the edge of the plate. Mom tiger in peach apron setting down a colorful dish. Inviting, warm.`

**P2 — 문제(거부)**
- 텍스트: *"\"당근은 싫어! 브로콜리도 싫어!\" 호리는 초록이랑 주황은 저 멀리 밀어 놓아요. 엄마는 살짝 걱정스러운 얼굴이 됐어요."*
- SCENE: `Close-up of Hori frowning, arms crossed, turning head away from a spoon of carrots and broccoli, tongue out in 'yuck'. The colorful vegetables pushed to the plate's edge. Mom tiger beside, gently concerned expression. Expressive, a little dramatic but cute.`

**P3 — 결과(기운 빠짐)**
- 텍스트: *"다음 날 아침, 호리는 어쩐지 기운이 하나도 없어요. 폴짝 뛰려 해도 다리가 무거워요. \"이상하다… 힘이 어디 갔지?\""*
- SCENE: `Morning. Hori trying to jump but looking droopy and tired, little gray cloud over head, half-deflated posture, dull colors around Hori only. Soft morning light through window. Sympathetic, gentle.`

**P4 — 전환(친구 등장)**
- 텍스트: *"그때 똑똑! 다람쥐 콩이가 놀러 왔어요. \"호리야, 우리 텃밭 가자! 오늘 무지개 채소 따는 날이야!\" 강아지 두부도 멍멍, 꼬리를 흔들어요."*
- SCENE: `Front door opens, squirrel Kongi (bushy tail, puffed cheeks, mischievous grin) waving excitedly holding a basket. White puppy Dubu wagging tail beside. Hori peeking out curious. Bright sunny outdoor light spilling in. Energetic, inviting.`

**P5 — 발견(텃밭의 색)**
- 텍스트: *"텃밭은 온통 무지개예요. 빨간 토마토, 주황 당근, 초록 브로콜리, 노랑 옥수수! \"우와…\" 호리의 눈이 동그래졌어요."*
- SCENE: `Sunny vegetable garden bursting with rainbow colors — red tomatoes, orange carrots, green broccoli, yellow corn. Hori standing wide-eyed and amazed, mouth in a small 'wow' O. Kongi happily picking veggies into a basket. Lush, vivid, joyful.`

**P6 — 프레임 전환(색=힘)**
- 텍스트: *"콩이가 속닥속닥. \"채소마다 색깔 힘이 숨어 있어! 빨강은 씩씩, 주황은 반짝, 초록은 쑥쑥!\" 정말? 호리는 침이 꼴깍 넘어가요."*
- SCENE: `Kongi whispering to Hori with a sparkly excited face, pointing at the veggies which have tiny magical glows around them (red glow, orange glow, green glow). Hori leaning in curious, a little drool, imagination sparkles in the air. Playful, magical-but-cozy.`

**P7 — 도전(한 입)**
- 텍스트: *"호리는 용기를 냈어요. 주황 당근을 아삭! \"…어? 달다!\" 초록 브로콜리도 오물오물. 생각보다 맛있어요. 골고루 냠냠, 무지개 힘이 쑥쑥!"*
- SCENE: `Hori bravely taking a big crunchy bite of a carrot, eyes popping in pleasant surprise, a burst of warm colorful sparkles around the mouth. Kongi cheering with both paws up. Dynamic, triumphant little moment. Confetti-like color specks.`

**P8 — 변화(힘이 솟음)**
- 텍스트: *"그러자 신기해요! 무거웠던 다리가 가벼워지고, 볼이 발그레, 꼬리가 살랑살랑. 호리 둘레로 무지개 색이 반짝반짝 돌아왔어요."*
- SCENE: `Hori glowing with energy, rainbow-colored sparkle aura returning around the body, cheeks rosy, tail swishing happily, doing a little energetic hop. Bright saturated colors fully restored. Joyful, lively.`

**P9 — 적용(저녁 식탁 재현)**
- 텍스트: *"저녁이 되자 호리가 먼저 외쳤어요. \"엄마, 오늘은 무지개 식판이야!\" 빨강 초록 주황 노랑, 골고루 한 입씩. 엄마가 빙그레 웃어요."*
- SCENE: `Evening dinner again, but now Hori proudly holding up a colorful plate arranged like a rainbow, taking a bite of each color, beaming. Mom tiger smiling warmly with hands together. Baby brother Hoya in bib watching and copying. Warm, heartwarming family glow.`

**P10 — 마무리(자기수용 + 후렴)**
- 텍스트: *"이제 호리는 알아요. 골고루 먹으면 무지개 힘이 솟는다는 걸! \"골고루 냠냠, 무지개 힘이 쑥쑥!\" 호리는 친구들과 폴짝폴짝, 오늘도 신나게 놀아요."*
- SCENE: `Hori running and jumping energetically outdoors with friends Toto (bunny) and Bori (bear) and Kongi (squirrel) and puppy Dubu, all happy, a faint rainbow arc in the sky. Full of vitality and friendship. Bright, uplifting closing spread.`

---

## 3. 이 템플릿의 재사용 규칙
- **나레이터 톤**: 3인칭 해요체 + 짧은 문장 + 캐릭터 직접대사 + **반복 후렴**(주제별 1개). 벤치마크 STT 분석에서 확인된 정형 패턴.
- **아크 5비트 고정**: 일상→문제→전환(친구/놀이)→도전·해결→자기수용+후렴.
- **장면 프롬프트**: 공통 스타일 앵커 + 고정 캐스트 외형 키 + `SCENE:` 한 줄. 캐릭터 외형은 바이블에서 복붙(일관성).
- **연령별 조절**: 2-3세=문장 더 짧게+후렴 비중↑ / 5-7세=갈등·대사 더 풍부.
