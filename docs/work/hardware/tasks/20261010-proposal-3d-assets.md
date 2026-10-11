# 제안서용 3D 원본 확인과 Blender 준비

- id: 20261010-proposal-3d-assets
- domain: hardware
- status: integrated
- updated: 2026-10-10
- base: 5d7516f3a
- branch: main
- worktree: C:/project/tangobook
- integration: 로컬 main 작업
- delivery: 미푸시·미배포

## 사용자 결정

사용자가 첨부한 아이·태블릿·흰 인식판·노란 블록·주황 반사경 이미지는 자체 3D 모델링을 활용한 이미지라고 설명했다. 원본을 `docs/marketing/assets/investor-20261010/hardware-use-furniture-user.png`에 보존했다. 이미지의 예시 낱말은 ‘가구’다. 사용자는 제작 방식 설명을 대외 캡션에 넣는 것을 거부했다. 캡션은 제품 경험을 설명하며, 3D 제작 정보는 내부 출처 기록에만 둔다. 이미지가 부족하면 추가 제작을 허용했고 Blender 설치를 요청했다. 기존 제안서의 ‘나무’ 예시를 아직 변경하지 않았다.

## 확인한 원본

| 구성 | 원본·현재 데이터 |
|---|---|
| 판과 거치대 조립 | `packages/client/public/tango-board-only.standalone.html`의 meshData. board/grid/cradle/tablet/frontFootLeft/frontFootRight/block/block1x2 8개 파트 |
| 인식판 최신 생성 | `hardware/studboard/flat_board.py`. 실제 표시 메시가 위 HTML에 내장돼 있음 |
| 거치대 최신 생성 | `hardware/studboard/tablet_backrest.py`, `hardware/studboard/out/tablet-cradle-backrest.step`. 최신 기록은 기둥 2개·15° 높은 등받이·노출 모서리 라운딩 |
| 자음 2×2 블록 | `hardware/studboard/sticker_block_2x2.py`, `out/sticker-block-2x2.step`, `out/sticker-block-2x2.stl` |
| 모음 1×2 블록 | `hardware/studboard/sticker_block_1x2.py`, `out/sticker-block-1x2.step`, `out/sticker-block-1x2.stl` |
| 반사경 최신 고정형 | `hardware/periscope/pebble_compact_fixed.py`, `pebble_compact_fixed_build.py`. 좌우 본체·누름혀·뒤판·상부 덮개 5파트, 거울·폼 별도 |
| 기존 NX 추출 | `packages/client/public/tango-board-3d.mesh.json`, `tango-lego.mesh.json` |

보드의 과거 `recognition-board-14x14.stl`은 돌기 없는 구형 판쉘이므로 최신 조립 렌더에 그대로 쓰지 않는다. 최신 반사경의 out 폴더 산출물은 이 checkout에 없고 생성 코드는 있다. `.blend` 원본은 조사한 hardware/현재 worktree/Downloads에서 발견하지 못했다. 이전 PC의 `C:/projects/...` 경로는 이 PC에 없으므로 현재 파일로 오인하지 않는다.

## 준비와 다음 행동

현재 Python에서 CadQuery/trimesh/numpy 설치 확인. Blender는 winget의 BlenderFoundation.Blender 공식 배포 MSI로 설치 완료. 경로는 `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`. 백그라운드 factory-startup 실행에서 `BLENDER_READY 5.2.2 LTS`, STL import 연산자 존재, 정상 종료를 확인했다. winget 설치 목록도5.2.2 확인. 실제 모델 가져오기·렌더는 아직 실행하지 않았다.

새 이미지가 필요하면 최신 조립 메시·CAD를 가져와 형태를 유지한 렌더를 만들고, 사용자 제공 이미지와 보드·블록·반사경 비율을 대조한다. 이번 원본 탐색은 새 실물 성능·출력 검증이 아니다. 원본 지도와 사용자 제공 이미지만 로컬 main에 기록하며 push·배포 없음.
## 2026-10-10 실제 모델 기반 이미지와 영어 확장 완료

- 사용자 지시: 필요한 이미지는 실제 3D 데이터 → Blender 장면 → imagegen 스킬 순서로 제작. 영어는 **자음용 정사각 블록에 알파벳**을 넣는다. C·A·T 모두 동일한 2×2 메시다.
- 한국어 가구 3장, 영어 CAT 3장: 제품 전체 / 블록 확대 / 아이 조작과 화면 반응. 영어 고양이는 기존 `word-en-b2-u01-5.webp`를 참조했다. 최종 6개 PNG 및 정확한 프롬프트는 [이미지 기록](../../../marketing/assets/investor-20261010/blender/image-prompts.md).
- `export-proposal-cad-20261010.py`: HTML 내장 조립 메시와 compact_fixed CAD 7파트(출력5+거울+폼)를 추출. 이번 반사경 선택은 사용자 참고 이미지에 맞춘 **고정형 버전**이다. 이후 높이 조절형 기록도 있으므로 최신 양산 설계라고 부르지 않는다.
- `build-proposal-blender-20261010.py`: 원본 메시로 재질·조명·카메라·글자 표면·태블릿 화면 구성. 영어는 명령 끝에 `-- english`. 언어별 3개 .blend와 1536×1152 PNG를 로컬 blender 폴더에 보존. .blend 및 중간 대형 JSON은 ignore, 재생성 스크립트와 렌더 PNG는 Git 보관.
- CAD 수출 때 이 PC의 native nlopt import가 멈추는 것을 traceback으로 확인. 사용하지 않는 VTK/nlopt import만 격리했으며 명시적 OCCT solid 연산과 tessellate를 수행했다. 최적화 연산으로 형상을 바꾸지 않았다.
- Blender 한글·영어 6장 렌더 정상 종료, 내장 image_gen 모드 6장 생성·육안 확인. 생성 결과는 형상 참고 제안서 이미지이며 치수 검증·실제 사용 사진·실기기 인식 성능 증거가 아니다.
- 사업계획서 2~5장에 반영. 5장은 한글/영어 선택으로 한 흐름만 표시한다. 쓰기는 별도 3D 원본을 확인하지 못해 중립적인 SVG 활동 설명도 사용. 제작 방식은 공개 캡션 대신 이 내부 기록에 둔다.
- 문서 2~5장 기본 폭과 390px에서 이미지 표시/가로 넘침 확인. 한글↔영어 전환 확인, Python 구문 및 문서 생성기 구문/재생성 확인. 인쇄·실기기 검증 미수행. 로컬 main 커밋만, push·배포 없음.
## 2026-10-10 한글 블록 글자 확대

사용자 요청으로 한글 물리 블록 글자를 키우고 모음 넘침 방지. Blender 글리프 실제 경계로 중앙 정렬/균일 확대: ㄱ 2.022배, ㅏ 1.683배, ㅜ 1.215배. 흰 라벨 안 최소 여백은 자음 3mm/모음 1.5mm로 assertion 확인. 원본 메시·영어 블록은 변경하지 않았다. 새 참조 3개는 `*-ko-v2.png/.blend`, imagegen 편집 결과는 `hardware-*-v2.png` 3개. 이전 v1 보존. 자세한 프롬프트는 기존 이미지 기록에 추가.

Blender 정상 완료 및 글자 치수 로그 확인, 최종 이미지 3장 글자 확대/모음 흰 면 내부 배치 육안 확인. 제안서 2~5장 이미지 교체, 브라우저 각 장 이미지 깨짐0/가로 넘침0 확인·캡처 갱신. AI 결과의 물리 치수 보장은 아니며 영어 이미지/제품 사양은 그대로다. 로컬 커밋만 수행, push·배포 없음.

## 2026-10-10 사용자 반증 — 기존 자모 스티커 원본 비율 우선

사용자가 기존에 만든 자음·모음 이미지가 있는데 새 그림의 비율이 맞지 않는다고 지적했다. 기존 출력용 원본 `output/pdf/tango-hangul-block-stickers-a4.pdf` 및 좌표JSON/생성기 `hardware/studboard/paper_hangul.py`를 확인했다. 자음27.2×27.2mm, 모음12.2×27.2mm 종이에 그룹 기준 글자 크기·굵기를 사용한다. 앞선 v2는 글리프마다 독립 확대해 원본의 자음·모음 관계를 바꿨으며, 라벨 경계 안이라는 검증만으로 비율이 맞다고 판단한 것은 부족했다.

원본 PDF의 ㄱ·ㅏ 라벨을 다시 그리지 않고 PNG로 렌더해 Blender 표면에 적용한다. ㅜ는 원본ㅏ를 시계방향90도 회전하며 같은 라벨/획 비율을 유지한다. 기존 출력PDF·CAD는 변경하지 않는다. 제안서 한글 제품3장과 아날로그 비교1장,5장 작은 자모 표시를 같은 원본 기준으로 맞춘다. 진행 중이며 최종 이미지/검증 결과는 아래에 기록한다.
# 자모 비율 수정 검수 완료 · 2026-10-10

완료: `export-original-block-labels-20261010.py`로 원본 라벨을 추출하고 `build-original-label-scenes-20261010.py`로 Blender 4장 재렌더. 내장 imagegen에 기존 사진·수정 렌더·원본 라벨2개를 전달해 한글 제품3장v3/독립 블록v2 제작. 2~5장 기본폭 육안 확인, 작은 자모는 원본 PNG를 직접 사용해 32×32/14.35×32px 및 회전으로 표시. 390/1280px 연결 장표 가로 넘침0·깨진 이미지0, 한영전환/내부팀 요약 확인. 생성 사진은 원본 비율을 참조한 시각 자료이며 정밀 치수 증거가 아님. 출력 PDF/CAD 변경 없음, push·배포 없음.
