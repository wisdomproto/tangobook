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
