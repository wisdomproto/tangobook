# 탱고노트 이미지 제작 기록 · 2026-10-11

원본 참고: 사용자가 제공한 `TangoNote_사업제안서 240624_font_final.pdf`의 6~8쪽 제품/활동 예시와 24~28쪽 학습지. 최종 구조·데이터 흐름은 현재 사용자 설명 우선.

Blender로 기존 블록판 외곽을 가져오고 돌기를 제외했다. 사용자가 돌출 고정대를 거절하여 왼쪽 테두리 **내부**에만 홈을 만든 v2로 수정했다. 종이 텍스처는 `build-tangonote-worksheet-20261011.cjs`에서 만든 SVG이며 가구 그림은 기존 `phonics-gagu-word.webp`다. 생성 이미지의 그림과 제품 형태는 렌더/원본과 육안 대조했다.

imagegen 스킬의 **내장 도구** 사용. CLI/API 경로는 사용하지 않았다. 순서는 Blender 렌더 → 상업 제품 사진 재질 정리 → 사용자 요청에 따른 앱 UI → 사용자 최종 정정에 따른 가구 그림만 표시. v4 이후 사용자 요청으로 가구 글자를 추가한 v5가 최종본이다. 아래 학습지는 그대로 유지한다. 제품 사진·학습 화면은 구성 예시이며 실제 양산·연동 테스트 사진이 아니다.

## v4 중간 편집 프롬프트

Edit INPUT 1 only inside the tablet screen. User requests ONLY THE FURNITURE PICTURE on the tablet. Remove every word, logo, Korean label, letter, handwriting, button, progress dot, reward star, check mark, Bluetooth icon, border panel and other UI from the tablet display. The entire screen now shows ONLY the charming felt-style wooden chair with pink cushion and teal blue drawer cabinet from INPUT 2, large and centered together on a clean warm ivory background, with natural comfortable margins. No text whatsoever on the tablet, including no 가구 text. Furniture illustration is the sole content of the display. Preserve EVERYTHING outside the screen exactly: approved white flat smooth note board, invisible concealed left paper insertion, entire colorful Korean printed worksheet with large 가 and 구 and lower practice cells, white pen with green cap, tablet casing, cradle, composition, lighting, warm studio background and shadows. Do not change or remove text from the PHYSICAL PAPER worksheet. Only simplify the TABLET display to the two furniture objects in Input2. Same high-end photorealistic product shot, same crop and dimensions.

입력1: 직전 UI 시안(v3, 로컬 백업). 입력2: 보유 가구 그림. 결과: v4(로컬 백업). 최종본은 아래 v5다.

## v5 최종 정정 프롬프트

입력: v4. 결과: `tangonote-product-v5.png`. HTML은 같은 이미지의 WebP 배포본을 내장한다.

Make one small change to this approved product photo: inside the TABLET display, add the Korean word '가구' in large clean dark teal Korean typography, horizontally centered BELOW the existing felt furniture picture. Keep the chair and blue drawer cabinet illustration; adjust their position slightly upward ONLY if needed to give the word comfortable breathing space. Screen contents must be exactly the furniture picture + the single word '가구', no other text, logo, UI, buttons, icons, progress, labels or decoration. The word must be correctly spelled 가구 and easily readable at proposal thumbnail size, with a calm modern rounded sans-serif look. Maintain tablet perspective and realistic screen appearance. Preserve everything outside the tablet screen exactly: white board, hidden left paper slot, colorful Korean printed worksheet, pen, rear cradle, background, lighting, crop and shadows. Do not alter the physical paper's text or design.
