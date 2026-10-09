# 탱고 카메라 교구를 쓰는 가상 아이 · Blender

- 작업: `20261009-tango-native-scene`, 브랜치 `codex/marketing-virtual-parenting`.
- 사용자 요청: 기존 공부방에서 아이가 태블릿의 가구 단어를 보고 블록을 맞추는 Blender 장면.
- 사용자 반증: 처음 가져온 `tango-board-3d.mesh.json`은 예전 판과 자모이며 최신 교구가 아니다. 첫 시안을 최신 교구 재현으로 취급하지 않는다.
- 사용자 추가 결정: 실제 우리 파닉스 콘텐츠 이미지 사용. 모든 블록 몸체는 노란색, 스티커는 흰 바탕에 검정 글씨.
- 최신 근거: `C:/projects/tangobook/.worktrees/periscope-redesign/hardware/studboard/TANGO-CAMERA.md`, `tasks/20261007-open-bottom-board-print.md`의 최신 후속 절. 14×14/15mm피치/226mm 판, 조립 다리, 뒤 기둥2개로 연결된 둥근 거치대. 자음 2×2, 모음 1×2 스티커 블록.
- 표시용 원본: 같은 worktree `packages/client/public/tango-board-only.standalone.html`의 board/grid/frontFootLeft/frontFootRight, `hardware/studboard/out/tablet-cradle-backrest-assembled.stl`, `sticker-block-2x2.stl`, `sticker-block-1x2.stl`.
- 실제 콘텐츠: `activity-data/coloring.json`의 `kr-h1-u02`, 가구, `phonics-word-cards/kr-h1-u02-gagu-18fdf742-w800.webp`. R2 GetObject로 원본만 읽어 로컬에 저장. 공개 CDN 403 후 기존 자격증명으로 읽기만 수행; 외부 수정 없음. 토큰/환경파일은 기록·커밋하지 않는다.
- 아이는 직접 만든 포즈 검토용 3D 조형. 이전 AI 아이의 실사 3D 복원은 아니다. 화면은 실제 단어 이미지와 단어를 배치한 샘플 UI이며 실제 앱 화면 캡처는 아니다.
- 초기/최신 렌더는 동일 D드라이브 tango-v8 페이지에 반영. 기존 study-v7 집은 보존.

## 재생성

```powershell
node scripts/virtual-parenting/fetch_tango_phonics.mjs
python scripts/virtual-parenting/prepare_tango_v8.py
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/build_tango_v8.py -- D:/ComfyUI-output/virtual-parenting-20261006 C:/projects/tangobook/.worktrees/periscope-redesign/hardware/periscope/out/pebble_compact_fixed
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/export_tango_v8_web.py -- D:/ComfyUI-output/virtual-parenting-20261006
```

원본 경로: `D:/ComfyUI-output/virtual-parenting-20261006/family-home-tango-v8.blend`. 렌더와 자산 해시는 `tango-v8/manifest.json`, 화면은 `tango-v8.html`. 제조/실시간 인식/카메라 광학 검증은 이 장면 작업의 증거가 아니다.

## 후속 사용자 반증 · 배치/오른손/단순 화면

사용자가 실사화는 그럴듯하다고 확인한 뒤 ‘구’의 ㅜ를 ㄱ 바로 아래, 아이 오른손 조작, 태블릿에는 가구 단어와 그림만 남기도록 지시했다. 모델의 기존 right라는 이름은 실제 아이 기준 오른손이 아니었다: 아이가 -Y를 바라보므로 아이 오른쪽은 world -X. 어깨3.8/팔꿈치3.74쪽 팔을 조작 팔로 옮기고 반대 팔은 쉬도록 수정한다. 두 번째 ㄱ 중심(3.855,-2.330), ㅜ 중심(3.855,-2.2925)로 X를 일치시키고 37.5mm 앞뒤 간격을 둔다. 모두15mm 격자/1×2 반칸 중심 규칙을 유지. 화면에서 자모 예시·헤더·로마자·안내문도 제거해 ‘가구’와 실제 그림만 표시한다. 첫 생성 사진은 이 후속 요구 이전판이며 새 3D에서 재생성해야 한다.

## 완료 · 2026-10-10

후속 요청: 책상 위에 다른 자음·모음 여분 블록을 놓는다. 기존 노랑/흰 스티커/검정 글씨를 유지하여 판 옆 빈 책상에 9개를 흩어 배치. 조작 손과 판 위 가구 배치는 보존한다. 최신 3D와 두 사진을 함께 갱신한다.

후속 완료: 첫 배치는 팔에 가려져 반대편(world X4.075~4.210, Y-2.455~-2.293)으로 옮겼다. 바닥 Z.484는 흰 상판 높이와 일치. 전체 GLB의 조합용4개+여분9개=13 블록을 확인하고 웹 GLB nodes/meshes/cameras 동일성 확인. 최신 Cycles 두 각도 육안 검수, 내장 imagegen 국소 편집 두 장의 기존 두 손 유지 확인. 선택 사진은 `over-shoulder-photo-v4.png`, `detail-photo-v5.png`, 프롬프트는 `tango-v8-spare-block-prompts.json`. AI 뒤쪽 사진의 여분 개수/배치에는 재해석이 있어 3D9개와 사진의 정확한 일치로 보고하지 않는다. 기존 사진과 생성 원본 보존. Python AST/JSON/HTML module 검사 및 diff 검증 통과.

- 저장된 Blender 장면의 ㄱ/ㅜ 같은 X, 오른쪽 어깨 위치를 export 스크립트에서 확인. 최신 Cycles 두 장과 웹 GLB에 반영.
- 내장 imagegen 사용. 뒤쪽 사진은 최신 원본만 참조한 `over-shoulder-photo-v3.png` 선택. 근접 재생성은 세 번째 손이 생겼고 사용자가 반증했다. 해당 실패본의 아래 오른쪽 추가 손/소매만 국소 편집하여 `detail-photo-v4.png` 선택. 작동 오른손 및 왼쪽 가장자리의 쉬는 손만 남은 것을 육안 확인했다.
- 원본만 참조한 다른 근접 생성도 새 머리/가구를 발명하여 탈락. 실패본은 `detail-failed-three-hands.png`, `detail-failed-room-drift.png`로 보존하고 페이지에서 제외했다. 원본 참조는 형상 고정 보장이 아니므로 국소 편집 후 검수가 필요하다.
- 최종 두 사진: `output/virtual-parenting/tango-v8/` 및 D드라이브 `tango-v8/`에 저장. 생성·수정 프롬프트는 `scripts/virtual-parenting/tango-v8-*-prompts.json`, 최종 국소 편집은 `tango-v8-photo-hand-fix.json`.
- `http://127.0.0.1:5191/tango-v8.html`: 원본 렌더 / AI 사진 / 동일 모델의 촬영 카메라 세 칸. 근접 버튼을 눌러 교체 사진과 3D 로딩 완료를 브라우저에서 확인.
- 검증: Python AST 세 파일, fetch 스크립트/HTML module `node --check`, 모든 프롬프트 JSON, 원본 자산 SHA256, full/web GLB의 nodes/meshes/cameras 동일, `git diff --check` 통과. 제품 코드 변경이 없어 monorepo 테스트는 실행하지 않았다. AI 사진의 치수·돌기·픽셀 구도가 완전히 동일하다는 검증은 아니다.
