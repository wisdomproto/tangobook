# 가상 육아 가족 — 3D 집 샘플

Blender 4.5.9로 만든 독자적인 거실·주방·독서 공간이다. 가구/소품 13개 그룹과 건축 4개 그룹을 별도 이름/asset_id로 저장한다. 브랜드 제품의 정밀 복제나 건축 시공 도면이 아니다.

## 재현

```powershell
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/build_home.py -- D:/ComfyUI-output/virtual-parenting-20261006
& scripts/virtual-parenting/prepare-viewer.ps1
$env:DISABLE_PUBLISH_SCHEDULER='1'
& C:/ComfyUI_windows_portable/python_embeded/python.exe -m http.server 5191 --bind 127.0.0.1 --directory D:/ComfyUI-output/virtual-parenting-20261006
```

마지막 명령은 정적 파일 서버다. TangoBook 앱 서버/운영 자격증명/발행 스케줄러를 로드하지 않는다. Three.js 0.180.0과 MIT 라이선스를 준비 단계에서 내려받고, 실제 뷰어는 로컬 파일만 읽는다. 의존성 설치나 lockfile 수정 없음.

생성 산출물: `family-home-v1.blend`, `family-home-v1.glb`, `assets.json`, `home-preview.png`. Git에는 생성 코드/뷰어를 저장하고 바이너리와 생성 로그는 D드라이브에 보존한다.

## 뷰어

http://127.0.0.1:5191/ 에서 회전/확대/이동, 집 전체/평면/독서/거실 시점, 거실 옆벽 표시, 가구만 보기, 가구 목록/직접 선택과 설계 치수를 확인한다. 앞쪽·천장 없는 cutaway로 구성하며 옆벽은 기본 숨김이다. 표시 치수는 자산 설명용 설계값이며 glTF mesh bounds 실측이 아니다.

Qwen-Image-2.1의 아이 독서 이미지(`reading-home-v1.png`)는 분위기 확인용 별도 시안이다. 3D 모델로부터 렌더링한 이미지가 아니며 배치가 완전히 일치하지 않는다. 3D 집에는 아직 아이 모델/리깅/영상이 없다.

## 네 시점의 이미지와 카메라 비교

```powershell
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/render_shots.py -- D:/ComfyUI-output/virtual-parenting-20261006
& C:/ComfyUI_windows_portable/python_embeded/python.exe scripts/virtual-parenting/generate_shots.py D:/ComfyUI-output/virtual-parenting-20261006
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/export_furniture.py -- D:/ComfyUI-output/virtual-parenting-20261006
& scripts/virtual-parenting/prepare-viewer.ps1
```

생성기는 기존 로컬 Qwen2.1 워크플로(`reading-home-v1-api.json`)와 Comfy8190/input 경로를 사용한다. 실행 전 큐를 확인하며, `/interrupt`나 전역 큐 삭제는 하지 않는다. 생성 결과는 육안 확인 전 자동 승인하지 않는다. 재실행 시 Comfy 원본 파일 번호/history는 보존되지만 뷰어가 쓰는 photo.png는 최신 결과로 갱신되므로 선택본 변경 전 별도 보관한다.

http://127.0.0.1:5191/comparison.html : 왼쪽 사진/3D원본 겹침 슬라이더, 오른쪽 실제 촬영 카메라의 위치·방향·시야와 동일 POV. 장면4개는 독서 정면/창가 측면/거실/주방. Blender의 카메라 frame을 glTF 좌표로 변환해 시야를 표시한다. AI 이미지는 이 렌더를 참조한 재해석이며 정확한 기하 보존을 보장하지 않는다. `shots.json`의 검수 메모와 원본 비교로 실제 차이를 확인한다.

`family-home-cameras-v1.blend/.glb`는 같은 가구에 실내 촬영용 천장과4카메라를 추가한 버전이다. 원래 cutaway 파일을 덮어쓰지 않는다. `furniture/`에는 원본과 같은13그룹을 바닥 기준 원점으로 옮겨 별도 GLB로 저장한다. `furniture.json`은 파일과 원래 집 배치를 연결한다.

## 사진 질감 시험

`generate_shots.py <출력폴더> --real reading-front`는 카메라 원본을 첫 번째 참조, `reading-home-v1.png`의 창가·빛 부분을 크롭해 사진 질감용 두 번째 참조로 사용한다. 새 파일은 `*-real-v5-photo.png`로 구분해 기존 결과를 보존한다. 두 번째 참조의 인물·집 배치를 복사하지 않도록 프롬프트에서 역할을 구분한다. 이 참조 역시 생성 이미지이며 실제 촬영 사진은 아니다.

`--faithful`은 원본을 VAE 인코딩하고 denoise0.45로 구조를 강하게 보존하는 비교 시험이다. 형태 유지에는 유리하지만 단순 모델의 렌더 느낌이 남아 사용자가 요구한 실사감에는 부족했다. 두 모드는 동시에 사용하지 않는다. 모든 시점이 검수된 후 `shots.json`의 image/variants/review를 갱신하며, 재생성 직후 자동으로 선택본을 바꾸지 않는다.


## 선택된 실사 이미지

사용자 요청으로 Qwen 시험 후 imagegen 스킬의 built-in image_gen으로 전환했다. 네 시점 `*-image-skill-v1.png`를 worktree의 `output/virtual-parenting/` 및 D드라이브 `shots/`에 보존한다. `image-skill-prompts.json`에 네 요청 원문이 있다. 사진을 만든 실행 도구는 built-in이며 Qwen 생성 스크립트로 이 결과를 재현할 수 없다. 별도 CLI/API fallback은 사용하지 않았다.

비교 뷰어는 shots.json의 variants 첫 항목인 Image skill을 기본 선택한다. 기존Qwen판도 고를 수 있다. 주요 가구/배치는 유지됐으나 AI가 소파 좌석 분할, 조명, 일부 소품을 재해석했다. 이 차이는 버전별 검수메모에 표시한다. 같은 카메라는3D 원본/오른쪽 POV의 불변 기준이며 생성 사진의 정확한 기하 보존을 보장하는 표시가 아니다.


사용자 후속 요청으로 동일 가상 아이의 독서/퍼즐/책 고르기3장을 추가했다. `*-child-v1.png`, `child-image-prompts.json`을 같은 출력폴더에 보존한다. 해당3시점의 기본 variant는 아이 버전이고, 빈 집 Image skill판도 선택 가능하다. 아이는2D 생성으로 추가했으며3D 모델/리깅이 아니다. 퍼즐 의자 위치와 작은 소품 변화는 검수 메모에 기록했다.

## 유아 활동 공간 샘플

`education-samples.html`은 기존 집/아이와 낮은 책상으로 만든3장의 시각 샘플과 교육 공간 배치 초안을 보여준다. 출력은 `education-samples/` 안에 저장한다.2번 기본판은 테이블 뒤 하체 가림 수정본 `02-geometry-close-v3.png`. `education-sample-prompts.json`, `education-anatomy-fix.json`에 요청과 검수 기록이 있다. 실제 교구의 판 인쇄·조각 구성·비율은 정확히 복제되지 않았으며 새 유아 가구는 아직 기존3D에 포함되지 않는다. 샘플 검토 후 상세3D 가구/배치를 다시 구성하는 순서다.

`build_layout_v2.py`는 기존 거실 옆에 별도 아이방을 붙인 초기3D 탐색본을 생성한다. `family-home-layout-v2.blend/.glb`, `layout-v2-assets.json`으로 저장하며 v1을 덮어쓰지 않는다. 실제 아파트84㎡ 평면을 재현한 모델이 아니고 원래 거실이 과하게 넓으므로 정식 집 구조로 채택하기 전 실제 평면 기반 재설계가 필요하다. 현재 기존 비교 뷰어의 선택 모델은 v1이다.


## 새 집 구조 v3 · 넓은 거실

`build_layout_v3.py`는 기존 v1 가구를 옮기고 거실/주방·가족식탁/아이방/현관과 화면 밖 방 외형을 다시 만든다. 초기 4.1×4.1m 거실은 사용자 반증으로 5.8×4.8m로 확대했다. 5.3m 창, 확대 러그, 소파 앞 여백을 확보했다. 아파트 평면의 연결 관계를 참고한 독자 촬영용 설계이며 정확한84㎡ 평면 재현이 아니다. 아이방에는83×58×48cm 책상·좌면28cm 의자·낮은 교구장·2단 전면 책장이 실제3D로 포함된다.

```powershell
& D:/blender/blender-4.5.9-windows-x64/blender.exe --background --python scripts/virtual-parenting/build_layout_v3.py -- D:/ComfyUI-output/virtual-parenting-20261006
& scripts/virtual-parenting/prepare-viewer.ps1
```

출력 `family-home-layout-v3.blend/.glb`, `layout-v3-assets.json`은 별도 파일이다. http://127.0.0.1:5191/layout-v3.html 에서 전체/평면/거실/아이방/주방/현관 시점, 벽 높이, 방 이름,16가구 치수 선택을 제공한다. 방 이름은3D 텍스처 대신 화면 좌표로 투영한14–16px 흰 바탕 DOM 글자로 표시해 거리/조명에 따른 흐림을 제거했다. 촬영 POV는 구도 확인용이며 기존 비교 뷰어처럼 Blender 센서/렌즈와 정확히 동기화한 카메라 프레임은 아니다. 기존 실사 샘플은 이전 집 기반이며 새 구조의 실사 생성은 별도 후속 작업이다.
