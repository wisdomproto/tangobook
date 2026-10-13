# Phonics mode buttons v1

2026-10-13. imagegen skill의 내장 image_gen으로 제작한 프로젝트 자산. 기본 로컬 Qwen 서버8188/8190은 연결되지 않아 내장 도구로 전환한다고 사용자에게 알렸다. 자유모드는 먼저 만든 커리큘럼 PNG를 그림체/외곽 참조로 사용했다. 모델명은 도구에서 반환하지 않으므로 추정하지 않는다.

- `curriculum.webp`: 징검다리에서 열린 책으로 이어지는 코랄 입체 버튼.
- `free.webp`: 블록·별·연필의 민트 입체 버튼.
- 각900×600, RGBA alpha 보존, WebP quality88, 합계114360bytes. 원본 그림 변경 없이 리사이즈/인코딩만 했다.
- 본체와 둥근 외곽·아이콘이 생성 이미지이며 모드 이름/화살표/번역은 DOM이다. 이미지 안에 글자·진도는 없다.
- `manifest.json`: 파일/원본 SHA256, 크기, 용량. 원본은 Codex generated_images에 보존하고 사용 파일은 저장소에 포함한다.

## Final prompt set

### Curriculum

Use case: stylized-concept, production game UI asset for TangoBook preschool phonics mode selector. Make ONE premium 3D tactile CURRICULUM MODE button sprite, on genuinely transparent background, landscape aspect approximately 3:2. Button silhouette must be a broad soft organic OVAL cloud-like pebble capsule, absolutely not a rectangle or rounded rectangle/card. Front view, slight visible sculpted thickness at bottom, warm peach-coral rubber/clay, subtle soft bevel and polished Pixar-like toy material but no franchise characters, gentle lighting. Integrated into upper half of the button: a beautiful tiny winding cream stepping-stone path ascending to a small open storybook, 3 stepping stones, a little green leaf, minimal preschool learning adventure. This is a clickable toy button not a landscape card illustration. Lower 35% of front surface is EMPTY LIGHT CREAM-PEACH smoothly inset oval area reserved for DOM dark text overlay; leave this wide open and perfectly readable. No letters, no text, no numbers, no arrow icons, no faces, no surrounding scenery, no square backing or white canvas. Generous transparent margin 6%, entire silhouette and tiny shadow visible. Professional paid children's educational game polish, strong button affordance, tasteful detail, uncluttered.

### Free

Use case stylized-concept. Input image is a STYLE AND SHAPE REFERENCE for a matching SECOND production preschool educational game button, FREE PLAY MODE. Match the exact organic oval cloud-pebble silhouette, front view, visible bottom thickness, scale, lighting, clay toy rendering and cream blank oval label area of the reference. Change warm coral material to soft mint turquoise. Replace the upper open book and stepping stone motif with a small delightful arrangement of toy play objects: one chunky coral building block, one little golden flower/star toy, and one stubby peach pencil angled gently, all integrated into the TOP HALF of the mint button. No alphabets or numbers on the blocks. This is a clickable toy button, not a scene card. Lower35% large CREAM smoothly inset oval area stays completely empty for DOM title overlay. Exactly ONE isolated button, genuinely transparent background, 3:2 landscape ratio, generous transparent margin, no text, letters, numbers, arrows, people, square backing, rectangular frames, white background, particles, or surrounding scenery. Premium paid children's educational game polish, minimal and coherent; same perspective and margins as first button.
