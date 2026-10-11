# 제안서 이미지 제작 · 2026-10-10

사용자 지시: 실제 3D 데이터로 Blender 장면을 먼저 만들고 imagegen 스킬로 이미지를 제작한다. 이번에는 명시적으로 요청한 스킬의 기본 내장 image_gen 경로를 사용한다. 최종 문서 캡션에는 제작 방식 대신 제품 경험을 설명한다.

## 공통 입력

1. 각 장면의 Blender 렌더: 제품 형상·부품 구성·상대 치수·배치의 기준.
2. `../hardware-use-furniture-user.png`: 사용자가 제공한 이미지. 색감·재질·생활 공간·가구 어휘 그림의 시각 참고.

Blender 장면은 현재 HTML의 보드·격자·거치·블록·태블릿 메시 및 compact_fixed 반사경 CAD를 사용했다. 모델 자체의 치수·결합부를 변경하지 않았으며 소재·조명·텍스트·구도만 제안서용으로 구성했다. STEP이나 STL을 임의의 비슷한 모양으로 대체하지 않았다. 반사경은 7개 파트(출력5+거울+폼)로 가져왔다. 렌더에는 실제 가구 색칠 정답 이미지가 화면 구도용으로 들어가지만 완성 이미지의 화면 그림은 사용자 제공 이미지의 스타일을 따른다.

## 1. 제품 전체

Use case: product-mockup.
Asset type: investor proposal product ecosystem image, landscape 4:3.
Input 1 is a Blender render made from our actual CAD: STRICT geometry and composition reference. Input 2 is the user's product-use visualization: material/color/art-direction reference only.
Create a premium photorealistic studio product photograph of exactly this TangoBook assembly. Preserve the white stud recognition board, its low rim and regular grid, the original white tablet cradle, portrait charcoal tablet, orange camera reflector mounted at the top, and four yellow-edge white-faced Hangul blocks. Preserve each component's proportions, silhouette and arrangement from input 1. The physical blocks form 가구: ㄱ plus a narrow vertical ㅏ, then ㄱ with a narrow horizontal ㅜ beneath. Keep these Korean letters correct.
Use warm ivory seamless studio surroundings, soft directional daylight, subtle realistic contact shadows, crisp polymer surfaces, rich but restrained colors. Improve contrast and materials compared with the draft render. Entire assembly visible, attractive three-quarter view, comfortable margins, product fills about 80 percent of the frame. On the tablet display show only the word "가구" with a charming textile-style chair and chest of drawers matching the imagery in input 2. Keep the word below the reflector, fully readable. No extra labels, no watermark, no people, no floating objects, no extra hardware, no invented lights/sensors, no diagram arrows.

## 2. 블록 조합

Use case: product-mockup.
Asset type: investor proposal tactile learning close-up, landscape 4:3.
Input 1 is the actual-CAD Blender close-up and determines all geometry. Input 2 provides product material and color styling only.
Create a premium macro product photograph of this exact white studded recognition board and these four yellow-rimmed, white-faced Hangul blocks. Preserve the sizes and positions from input 1: square consonant ㄱ with narrow vertical vowel ㅏ makes 가; square consonant ㄱ with narrow horizontal vowel ㅜ directly below makes 구. Correct complete letters, no extra symbols. Keep every block seated naturally on the stud grid. Frame the tactile block arrangement prominently, with white board studs and low rounded rim visible; the distant tablet or cradle may be softly blurred but must retain the original geometry. Warm soft daylight, clean ivory surroundings, realistic matte injection-moulded texture and fine shadows, restrained editorial product photography. No hands, no captions, no additional objects, no pasted-on arrows or decorative icons. Do not change the letter composition.

## 3. 화면 안내와 손의 조작

Use case: photorealistic-natural.
Asset type: investor proposal connected-learning hero, landscape 4:3.
Input 1 is an actual-CAD Blender scene: preserve exact board, block, tablet cradle and camera-reflector geometry and their relative placement. Input 2 is the user's existing learning scene: follow its believable child interaction, warm materials and quiet home atmosphere.
Show a preschool child from behind and slightly to one side using the exact assembly from input 1 on a light wood desk. Frame the child's shoulder and a natural small hand gently placing the narrow horizontal ㅜ block below the second ㄱ; the other blocks are already placed, forming 가구. Keep the board and screen clearly visible and the camera reflector unobstructed. Anatomy must be natural, one hand with five fingers, no overlapping extra hands, no stretched arm. Preserve the exact white recognition board, regular studs, white cradle, yellow-edged Hangul blocks, portrait tablet and orange camera reflector. The screen shows the correctly spelled Korean word "가구", the textile chair and chest-of-drawers artwork inspired by input 2, and one small restrained completion check mark below the picture, suggesting a response to the completed word. No other text, no arrows, no floating overlays, no invented accessories. Use high-end editorial lifestyle photography, calm warm daylight, realistic fabric and skin, minimal softly blurred reading-room background. The product experience is the focal point, not the child's face. Comfortable crop with the full board and top reflector included.
## 영어 버전 · 사용자 추가 지시

자음용 정사각 2×2 블록에 알파벳을 넣는다. C·A·T 모두 동일한 `block` 메시이며 모음용 직사각 블록은 영어 장면에 쓰지 않는다. 화면 그림은 보유 자산 `strategy-20261005/word-en-b2-u01-5.webp`의 고양이다. 예시는 CAT 하나로 통일한다.

### 영어 1

Use case: product-mockup. Landscape 4:3 premium investor proposal product photograph.
Input1 is our actual CAD Blender scene and the strict product geometry/composition reference. Input2 is the approved Korean studio image, a material/lighting reference only. Input3 is our existing cat vocabulary artwork to put on the tablet.
Create the English version of the same TangoBook assembly, retaining the white stud recognition board, low rounded rim, white cradle, portrait charcoal tablet and orange top camera reflector. Exactly THREE identical SQUARE yellow-edged white-faced blocks from the consonant block model, now printed C, A, T left to right. Each letter has its own square block. A is on the same square block as C and T, never a narrow vowel block. Preserve relative component dimensions from input1.
The tablet shows only the correctly spelled large title "CAT" and the cute grey felt cat from input3. No Hangul, no furniture pictures. Warm ivory studio, soft daylight, fine matte polymer texture and convincing contact shadows; refined high-end commercial product photography. Entire product visible with comfortable margins, three-quarter view. No hands, no captions, no extra blocks, no arrows, no invented sensors/accessories. Keep all letters legible.

### 영어 2

Use case: product-mockup. Landscape 4:3 premium tactile learning close-up.
Input1 is our actual-CAD Blender render, controlling geometry, proportions, placement and camera. Input2 is the finished English product studio image, controlling material, color and lighting.
Show the exact white studded recognition board with exactly THREE identical square yellow-edged white-faced consonant-model blocks, printed uppercase C A T left to right. All three are the same square block, including A. Preserve shallow block depth, rounded edges, small edge notches, regular board studs and natural seated contact. Focus on the tactile letter arrangement; softly out-of-focus bottom of the portrait tablet/cradle may appear at the rear edge. Screen art if visible is the grey felt cat, never furniture or Korean letters. Refined macro product photography with warm ivory tones, matte polymer, soft directional daylight and crisp subtle contact shadows. No hands, no extra letters/blocks, no narrow rectangular blocks, no annotations, no accessories.

### 영어 3

Use case: photorealistic-natural. Landscape 4:3 connected-learning hero for investor proposal.
Input1 is the Blender scene built from our actual CAD and controls exact component proportions/geometry/layout. Input2 is our English studio product image and controls materials, colors, screen artwork. Input3 shows desired child interaction and warm home atmosphere, NOT the Korean words.
Photograph a preschool child from behind and slightly left, seated at a light wood desk, gently placing the last square T block to the right of square C and square A. Exactly three IDENTICAL SQUARE yellow-edged white-faced blocks, uppercase C A T left to right. These are our square consonant-model blocks with alphabet labels; A must be square too, no narrow vowel block. Preserve the white studded recognition board, shallow rounded rim, white cradle, portrait charcoal tablet and top orange camera reflector from input1. Full board and reflector visible, fingers do not conceal the letters. Believable small hand and natural arm; no extra fingers/limbs.
Screen shows large correctly spelled "CAT", our cute grey felt cat on ivory, and a small subtle green completion check below the image, suggesting feedback. No other screen text, no furniture, no Korean letters. Calm high-end editorial lifestyle photography, soft warm daylight, natural skin and fabrics, quiet blurred reading-room background. Product and hand interaction are the focus. No arrows, labels, floating icons, extra blocks or invented hardware.
## 저장·재생성·검수

최종 출력은 부모 폴더의 `hardware-kit-studio-v1.png`, `hardware-block-detail-v1.png`, `hardware-feedback-use-v1.png`와 각각의 영어 `-en-v1.png` 3개다. 기본 내장 image_gen 사용, 6장 모두 육안으로 글자/배치/제품 구성 확인. 한국어 아이 조작 생성에는 해당 Blender 렌더·사용자 이미지 외에 완성 studio 이미지도 재질 참고로 함께 제공했다.

Blender 참조: `product-scene.png`, `block-detail-scene.png`, `interaction-scene.png`; 영어는 각 파일명 끝에 `-en`. 동일 이름 .blend는 로컬에 보존하며 Git에서는 제외한다. 중간 geometry JSON도 재생성 가능하므로 제외한다.

```powershell
python docs/marketing/drafts/export-proposal-cad-20261010.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python docs/marketing/drafts/build-proposal-blender-20261010.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python docs/marketing/drafts/build-proposal-blender-20261010.py -- english
```

원본 CAD는 작업 시작 커밋 bac6cafc5 기준. 반사경은 사용자 참고 이미지에 맞는 compact_fixed 고정형이며, 이후 높이 조절형보다 최신이라고 주장하지 않는다. 생성 이미지의 세부 형상은 AI가 달리 그릴 수 있어 제조 도면이나 치수·실기기 성능 검증에 사용하지 않는다. 카메라 위치·보드/블록 비율·글자·아이 손을 시각 점검했으며, 화면 체크 표시와 화면 구성은 제품 경험 설명용이다. 실제 동작 녹화나 아동 사용 실적이 아니다.
## 한글 글자 확대 v2 · 2026-10-10

사용자 요청: 한글 블록 글자를 키우되 모음이 블록 밖으로 나가지 않게 한다. Blender 실제 글리프 경계로 균일 확대 후 중앙 정렬. 흰 라벨 기준 자음 최소 여백 3mm, 모음 1.5mm. ㄱ은 기존 2.022배(21.2×16.54mm), ㅏ는 1.683배(5.96×24.2mm), ㅜ는 1.215배(16.21×9.2mm). 이 수치는 Blender 장면의 텍스트 치수이며 AI 이미지의 정밀 계측값이 아니다. 세 참조 장면은 `*-ko-v2.png/.blend`, 최종은 `../hardware-kit-studio-v2.png`, `../hardware-block-detail-v2.png`, `../hardware-feedback-use-v2.png`. 이전 v1 및 영어 이미지는 보존. 내장 image_gen 편집 모드. 최종 세 이미지 육안으로 글자 확대와 모음 여백 확인.

### v2 편집 1

Edit image1, the existing finished TangoBook studio product photo. Image2 is the revised Blender reference for physical block LETTER SIZE and placement only.
Change ONLY the printed Hangul on the FOUR physical blocks: make both square-block ㄱ letters about twice the current visual size, taking about 78% of the white label width, centered with clean margins. Make vertical ㅏ taller to occupy about 89% of its narrow vertical WHITE label height, but keep its entire short rightward stroke inside that white label. For horizontal ㅜ, modestly enlarge to fit safely inside its wide SHORT white label, leaving a visible margin on all sides. Use the correct ㄱ / ㅏ / ㄱ / ㅜ glyphs and preserve their proportions. Absolutely no ink outside the individual white label faces, no ink on yellow edges, no cropped strokes, no letters crossing between blocks. Follow image2's precise glyph sizing. Print dark forest-green, clean sans-serif, sharp and legible.
Keep the original photograph composition, light, background, stud board, all FOUR block sizes and placement, white cradle, portrait tablet, orange camera reflector and tablet's 가구 title and felt chair/drawers artwork unchanged. Do not use image2's flat cartoon screen. No new objects or labels. Output landscape 4:3 premium photo, same scene.

### v2 편집 2

Use case: precise-object-edit. Edit image1 (finished close-up photo). Image2 is the exact revised Blender letter size/placement reference. ONLY enlarge the printed Hangul on the physical blocks to closely match image2.
Both square ㄱ consonants: same typeface and stroke weight, about twice image1's current glyph size, occupying 78% of the square white face width. Vertical ㅏ: taller, centered on the narrow vertical block with every stroke safely within its white face. Horizontal ㅜ: modest enlargement, fully inside its short horizontal white face. Vowels keep at least a visible 1.5mm margin around the ink, consonants 3mm on the tightest side. Use image2's shape and fit; never extend ink onto yellow rims or outside a block. Keep the correct characters ㄱ ㅏ and ㄱ ㅜ, and their proportions. Dark forest-green clean medium-weight sans-serif print, same weight for the TWO ㄱ letters.
Preserve camera angle, photo lighting, background, white stud board, block shapes, positions and yellow rims, all other objects and tablet content exactly as image1. Do not resize or move the blocks themselves. No arrows, no new accessories, no text overlays. Landscape 4:3.

### v2 편집 3

Use case: precise-object-edit. Image1 is the finished child-using-product photo to edit. Image2 is our revised Blender scene, reference ONLY for physical Hangul letter size and placement.
Increase the printed Hangul glyphs on the FOUR physical blocks so they are easy to read. Both square ㄱ letters should be about twice image1's current size and occupy about 78% of their white label width, with matching font and weight. The narrow vertical ㅏ should be taller, centered, with its full rightward short stroke staying inside its own narrow white label. The short horizontal ㅜ must be modestly larger but completely inside its own white face, with visible whitespace around all strokes. Match the fit from image2: at least 1.5mm margin for vowels, 3mm for consonants at the tightest side. Clean dark forest-green medium-weight sans-serif print. No ink on yellow rims, no letters crossing blocks, no missing or cropped strokes.
Keep EVERYTHING else in image1: child's face/hair/body/hand anatomy and pose, clothing, room, warm light, camera angle, board studs, all block sizes and positions, cradle, tablet, orange reflector, 가구 screen title, felt chair/drawers and completion check. Do not replace the screen with image2's cartoon. No extra blocks or captions. Same 4:3 composition and photoreal finish.
# 2026-10-10 쓰기 활동 이미지 보강

모드: 내장 imagegen. Blender 구도 `writing-activity-scene.png`와 기존 `../hardware-feedback-use-v2.png`를 참조해 생성. 출력 `../furniture-writing-use-v1.png`. 일반 종이 따라쓰기 활동이며 탱고 노트의 확정 외형·전자 입력 장치가 아니다. 제작 방식은 내부 기록에만 남기고 대외 캡션은 활동을 설명한다.

Blender 재현: `docs/marketing/drafts/build-writing-scene-20261010.py` (기존 로컬 `product-scene-ko-v2.blend` 필요). 종이·가구 글자·카메라·조명을 구성해 `writing-activity-scene.blend`/PNG 저장. 기존 CAD는 변경하지 않았다.

최종 프롬프트:

Use case: photorealistic-natural. Create a premium investor-proposal photo of a preschool child's hands practicing handwriting on ordinary cream paper on a light oak desk. Landscape 4:3, closely framed tactile activity, no face.
Input1 is our Blender paper composition: use its paper perspective and the correctly spelled Korean word 가구, with ample margins. Input2 is our product photo: match its warm daylight, restrained cream/forest-green palette and natural small hands/fabric quality, but DO NOT include its tablet/blocks/board/reflector.
The paper shows a small dark-green printed "가구" at the top and two large light-grey tracing "가구" words below on subtle writing guide lines. A child's right hand with anatomically correct fingers holds a simple dark-green wooden pencil, tracing the first large word, partially completing 가 in graphite while 구 remains a light-grey guide. Left hand lightly steadies the far paper corner. Make the writing hand and pencil tip visible, leave the full word readable. Realistic gentle pencil pressure, matte paper grain, soft contact shadows, cozy muted sage knit sleeve, minimal background. Clear, attractive, professional editorial education photography.
This is a generic PAPER handwriting activity example, not a fabricated electronic writing product: no brand, no electronics, no plastic pad, no sensor, no cable, no touchscreen, no invented product, no labels or arrows. Preserve correct Hangul lettering, no extra text or misspelled characters. Entire sheet mostly visible with comfortable margins.

## 2026-10-10 독립 아날로그 블록 비교 이미지

모드: 내장 imagegen. `build-analog-example-20261010.py`로 기존 블록 메시·글자 배치를 유지하고 태블릿·보드·거치대·반사경을 제거한 Blender 장면 구성. 목재색 블록 재질을 사용한 일반 활동 예시이며 실제 경쟁사 제품/사용 사진이 아니다. 원본 CAD/제품 이미지는 보존. 참조1 `analog-blocks-scene.png`는 형상·배치, 참조2 `../furniture-writing-use-v1.png`는 조명·책상·색감. 결과 `../analog-blocks-standalone-v1.png`는 제안서2장에만 사용.

최종 프롬프트:

Use case: photorealistic-natural. Create a premium editorial education photograph, landscape 4:3. Reference 1 is our Blender composition: preserve the FOUR separate physical block shapes, exact Hangul glyphs ㄱ ㅏ ㄱ ㅜ, their sizes and arrangement forming 가구. Two square consonant tiles, one narrow vertical vowel tile, one short horizontal vowel tile. They lie directly on a light oak tabletop, with NO board, NO base, NO tablet, NO electronics, NO stand, NO reflector. The pale natural-wood rims and ivory labels are unbranded generic analog learning blocks, dark forest-green letters large but completely within each face. Reference 2 gives the warm oak desk, daylight, matte tactile surfaces and restrained cream/sage aesthetic. Frame the four blocks closely enough to remain legible as a small editorial image, with natural contact shadows and crisp edges, slight perspective from above matching reference1. A young child's single anatomically correct small hand with a muted sage knit sleeve can enter subtly from the lower left, pointing near the blocks without covering any letters. No pencil, no worksheet, no extra blocks, no new words, no captions, no logos. This illustrates standalone analog block play, not an electronic product or an actual competitor. Warm, polished, realistic photography, not an illustration or diagram.
# 원본 스티커 비율 복원 · 2026-10-10

기존 출력 PDF `output/pdf/tango-hangul-block-stickers-a4.pdf`에서 ㄱ·ㅏ 라벨 추출: original-label-giyeok.png / original-label-a.png. ㅜ는 동일ㅏ 회전. 기존 PDF/CAD 변경 없음.

| 기존 사진 | Blender 참조 | 새 결과 |
|---|---|---|
| hardware-kit-studio-v2.png | product-scene-ko-v3.png | hardware-kit-studio-v3.png |
| hardware-block-detail-v2.png | block-detail-scene-ko-v3.png | hardware-block-detail-v3.png |
| hardware-feedback-use-v2.png | interaction-scene-ko-v3.png | hardware-feedback-use-v3.png |
| analog-blocks-standalone-v1.png | analog-blocks-scene-v2.png | analog-blocks-standalone-v2.png |

각 편집은 위 사진+Blender+원본 라벨2개 총4장 참조. 내장 imagegen,4:3 불투명 결과. 독립 블록에는 전자기기 추가 금지 지시 추가. 원본 형태 참조용 제안서 이미지이며 치수/제품 성능 증거가 아님.

공통 편집 프롬프트:

```text
Use case: precise-object-edit. Image1 is the photo to edit, image2 the corrected Blender label geometry/placement reference, images3 and4 the user's ORIGINAL ㄱ and ㅏ print-sticker artwork. Replace ONLY the four physical block prints with these exact ORIGINAL sticker designs. The old independently enlarged green letters are wrong. Preserve the original BLACK bold silhouette, stroke thickness, label whitespace and glyph-to-label proportions from images3/4. The square ㄱ sticker is 27.2x27.2mm; the narrow ㅏ is 12.2x27.2mm; the horizontal ㅜ is EXACTLY that same ㅏ sticker rotated clockwise90 degrees. Both ㄱ must match each other; ㅏ and ㅜ must have the same main-stem length/thickness, rotated. Scale full sticker uniformly to physical face, NEVER fit each glyph independently. ㄱ ink occupies about56% of square face width; ㅏ stem about63% of narrow face height; exact reference takes priority. Generous original white margins, no ink crossing the face. Preserve ALL other pixels/features: physical block sizes/positions/rims, board studs, tablet content, orange reflector, camera angle, lighting, room, any hands/people. No extra props/captions. Do not replace product screen with Blender artwork. Same4:3 photoreal photo.
```

스튜디오 편집 프롬프트:

```text
Use case: precise-object-edit. Edit ONLY the printed Hangul artwork on the four physical block labels in image1. Image2 is the corrected Blender reference with the user's ORIGINAL PRINT STICKER artwork, not a font size suggestion. Images3 and4 are the exact original ㄱ square label and ㅏ narrow label; use their glyph silhouette, stroke weight, black color, white margins and proportions faithfully. The previous image has independently enlarged characters that are WRONG. Replace them with these original label images, scaled uniformly with the full label, never fitting individual letters to maximize size. Each ㄱ label is 27.2 x 27.2mm; each ㅏ label is 12.2 x 27.2mm. The horizontal ㅜ label is the SAME ㅏ label rotated clockwise 90 degrees (27.2 x 12.2mm), so its main-stroke length and stroke thickness match ㅏ. ㄱ occupies about 56% of square label width with substantial original whitespace; ㅏ's main stem occupies about 63% of narrow label height. Use the exact refs over these approximate percentages. Both ㄱ prints identical. Glyphs are BLACK bold artwork, not green. Preserve all physical block dimensions, positions, rims and white face dimensions; no resizing blocks. Preserve EVERYTHING ELSE in image1 including perspective, light, background, board, tablet screen, product components, any hands/people and framing. No captions or new objects. Photorealistic finish, same 4:3 aspect.
```
