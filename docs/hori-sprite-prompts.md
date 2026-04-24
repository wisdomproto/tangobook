# Hori Sprite Generation Prompts

게임용 호리(아기 호랑이) 스프라이트 생성용 프롬프트 모음.

## 사용법

1. 참고 이미지로 **`packages/client/public/mascot/hori/pointing.webp`** 첨부
2. 아래 **BASE PROMPT** 블록 통째 복사
3. `POSE:` 줄만 아래 **포즈 리스트**에서 원하는 것으로 교체
4. Gemini 3 Pro Image로 생성

첫 "골든 아이들" 생성 후부터는 **그 결과물을 참고 이미지로 교체**하면 프레임 간 일관성이 더 높아짐.

---

## BASE PROMPT (복사해서 쓰기)

```
Generate a sprite frame of Hori, the cute baby tiger cub mascot shown in the reference image. Match the EXACT same character identity, colors, proportions, and illustration style as the reference.

POSE: standing idle, arms relaxed at sides, tail curled slightly, gentle smile, front view facing the viewer.

Style: 2D storybook illustration, soft brown outlines (not harsh black), gentle airbrush shading, slightly fluffy digital painting texture, warm and cozy — identical to the reference.

Anatomy: super-deformed chibi — head 1.3× the body size, short chubby limbs, 3-finger rounded paws, round cream belly, two upright ears with white inner tufts, long fluffy tail with 3-4 brown ring stripes, large round brown eyes with white highlights, small pink triangle nose, prominent pink cheek blush on both cheeks, short white whiskers.

Colors: warm orange fur (#F8A755 to #FF8C3F), dark warm brown stripes (#5A3A22), cream belly and inner ears (#FFF5E4), soft pink nose (#F4A3A3), rose pink cheek blush (#F9B8B8), rich brown eyes (#4A2F1A), soft brown outlines (#6B4423).

Canvas: 1024×1024 square, solid pure magenta #FF00FF background (this will be removed later via chroma key), character centered horizontally, feet at ~88% y, minimum 8% padding on all sides.

Strictly exclude: no ground, no cast shadow on background, no scene, no props, no text, no watermark, no additional characters, no photographic realism, no 3D render, no glossy plush texture, no harsh black outlines, no flat vector look, no checkerboard pattern, no gradient background, only pure flat solid magenta.

Output: PNG on solid magenta background.
```

> **왜 매젠타?** "transparent"라고 하면 Gemini가 체커무늬를 그려넣는 실수를 자주 함. 순수 매젠타(#FF00FF)는 호리 팔레트에 없는 색이라 후처리로 안전하게 제거 가능. 생성 후 아래 **후처리** 스크립트로 alpha 변환.

---

## POSE 리스트 (원하는 걸 `POSE:` 줄에 대입)

### 공통 (모든 게임에서 사용)

| 이름 | 프롬프트 |
|---|---|
| idle | `standing idle, arms relaxed at sides, tail curled slightly, gentle smile, front view facing the viewer` |
| celebrate | `celebrating with both arms up in a V shape, mouth open in big happy smile, one leg kicked up playfully, tail up, front view` |
| hurt | `getting hit, eyes squeezed shut, both arms up defensively in front of face, leaning back, tail stiff, front view` |

### 달리기 게임 (Hori Run)

| 이름 | 프롬프트 |
|---|---|
| run-1 | `running mid-stride frame 1, right leg forward and bent, left leg back and extended, right arm swinging back, left arm swinging forward, body leaning slightly forward, tail streaming behind, determined small smile, three-quarter side view facing right` |
| run-2 | `running passing position frame 2, both legs under body with right leg just landing, arms in neutral swing, body upright, tail streaming, determined small smile, three-quarter side view facing right` |
| run-3 | `running mid-stride frame 3, left leg forward and bent, right leg back and extended, left arm swinging back, right arm swinging forward, body leaning slightly forward, tail streaming behind, determined small smile, three-quarter side view facing right` |
| run-4 | `running passing position frame 4, both legs under body with left leg just landing, arms in neutral swing, body upright, tail streaming, determined small smile, three-quarter side view facing right` |
| slide | `sliding on belly, arms stretched forward, legs stretched back, mouth open in determined expression, tail trailing, side view facing right` |

### 점프 게임 (Hori Jump)

| 이름 | 프롬프트 |
|---|---|
| jump-up | `jumping upward, both arms raised high, legs tucked under body, tail streaming down behind, eyes wide with excitement, mouth in small surprised O, front view` |
| jump-peak | `at the peak of a jump, arms slightly raised to the sides, legs splayed outward, tail relaxed, eyes bright and focused, front view` |
| fall | `falling down, arms out to the sides for balance, legs dangling slightly bent, eyes wide, mouth slightly open, tail up behind, front view` |
| land | `just landed from a jump, knees bent in landing pose, arms spread low for balance, looking forward determined, tail down, front view` |

### 보글보글 게임 (Hori Bubble)

| 이름 | 프롬프트 |
|---|---|
| shoot-1 | `preparing to blow a bubble frame 1, cheeks slightly puffed, arms coming forward, eyes focused, three-quarter side view facing right` |
| shoot-2 | `blowing a bubble frame 2, cheeks fully puffed, both arms forward, eyes focused and bright, mouth pursed, three-quarter side view facing right` |
| shoot-3 | `just after blowing a bubble frame 3, mouth slightly open and relaxed, arms still forward, looking forward, three-quarter side view facing right` |
| look-up | `looking up alertly, head tilted up, arms down, ears perked forward, front view` |

---

## 일관성 팁

1. **참고 이미지 교체 전략**: 첫 idle을 10~20장 돌려서 가장 깔끔한 1장 선정 → 그걸 "골든 아이들"로 저장 → 이후 모든 프롬프트에 `pointing.webp` 대신 골든 아이들을 ref로 사용
2. **스프라이트 스트립 동시 생성**: 러닝 사이클처럼 프레임 간 일관성이 중요한 경우, "horizontal sprite strip, left to right: frame 1, frame 2, frame 3, frame 4 of a running cycle"로 **한 이미지에 4프레임 동시 생성**하면 얼굴·비율이 흔들리지 않음. 이후 슬라이싱으로 분리.
3. **Seed 실패 시**: 3~4번 돌려도 얼굴이 이상하면 POSE 설명을 더 단순화. 긴 설명보다 명확한 단어가 유리.

## 후처리

### 1. 매젠타 배경 제거 (필수)

```python
from PIL import Image
from collections import deque

def magenta_to_alpha(src, dst, tolerance=30):
    img = Image.open(src).convert('RGBA')
    W, H = img.size
    px = img.load()
    visited = bytearray(W * H)

    def is_magenta(r, g, b):
        # #FF00FF에 가까운지 (R,B는 높고 G는 낮음)
        return r > 200 and b > 200 and g < 80

    q = deque()
    for x in range(W):
        q.append((x, 0)); q.append((x, H - 1))
    for y in range(H):
        q.append((0, y)); q.append((W - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or x >= W or y < 0 or y >= H: continue
        idx = y * W + x
        if visited[idx]: continue
        visited[idx] = 1
        r, g, b, a = px[x, y]
        if not is_magenta(r, g, b): continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x+1,y), (x-1,y), (x,y+1), (x,y-1)])

    img.save(dst)

magenta_to_alpha('input.png', 'output.png')
```

### 2. 나머지 단계

```
2. bounding box crop → 1024×1024 canvas에 re-center
3. 스프라이트 시트 조립 (게임당 단일 PNG + JSON atlas)
4. 다운스케일: sharp bicubic으로 256×256 또는 128×128
```

### 3. 과거 체커 패턴 파일 (레거시)

초기 생성물이 체커무늬 배경이면 flood-fill + "회색/흰색 모노톤 + 루미넌스 > 180" 조건으로 제거. 코드는 `scripts/remove-checker-bg.py` 참고 (있다면).
