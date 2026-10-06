# 탱고 카메라 버전 — 교구 설계 인수인계

2026-10-06 사용자 명명: **이 교구는 탱고 카메라 버전**. 다른 세션에서 이 문서부터 읽고 이어간다.

## 현재 최종 선택

| 항목 | 치수·구조 |
|---|---|
| 격자 | 14×14칸, 피치15mm, 안쪽210×210mm |
| 인식판 | 베젤15mm, 판240×240×20mm, 외곽 모서리R15 |
| 조립 전체 | 판과 거치부240×300mm, 본체 높이20mm(태블릿·블록 제외) |
| 태블릿 거치 | 탈부착 도브테일, 수직에서 뒤로15°(책상 기준75°) |
| 태블릿 홈 | 폭13mm, 바닥 약5mm·삽입 깊이약15mm, 양끝 열림 |
| 도브테일 | 판 뒤 가로210mm 수레일, 목높이8mm·머리높이12mm |
| 조립 방향 | 거치부를 판 오른쪽에서 왼쪽으로 밀어 넣음. 암레일 왼쪽 개방·오른쪽 끝벽 정지 |
| 결합 공차 | 암레일 단면0.10mm 여유, 두 구간의 낮은 마찰 리브로 빠지는 방향 저항. 실출력 조정 필요 |
| 라운딩 | 노출 수레일/양끝R1.2, 암레일 진입R0.5, 태블릿 홈 바닥·벽 연결/윗입구R0.8, 거치부 외곽R8/상단R1 |
| 블록 | 2×2칸, 29.6×29.6×5.5mm, 모서리R3/상단R0.35 |
| 블록 바닥 | 원래 9교점 돌기 회피 홈(중앙1·변4·귀퉁이4), 반경2.85·깊이3.2mm |
| 블록 윗면 | 평평한27.6mm 스티커 자리, 테두리 폭1mm·높이0.8mm |

실험 중의16×16판/단순두탭/일체형거치/블록바닥4blind홈/높이8mm블록/거치10도·높이42mm·깊이36mm는 **최종 선택이 아니다**. 과거 task의 최신 후속 절을 우선한다.

## 파일과 재개 위치

- [단독 HTML](../../packages/client/public/tango-board-only.standalone.html): 서버 없이 직접 열기. 기본 조립, 블록 위/아래, 태블릿 예시, 옆으로 분리 보기. `#tablet`/`#exploded` URL도 지원.
- [판·거치 생성](tablet_cradle.py): CadQuery/trimesh. 판쉘·도브테일·거치 홈 CAD와 HTML board/grid/cradle/tablet를 갱신.
- [2×2 블록 생성](sticker_block_2x2.py): 블록 CAD 및 HTML block 갱신. 판 중심105/놀이면약13mm에 배치.
- [판쉘 STEP](out/recognition-board-14x14.step), [판쉘 STL](out/recognition-board-14x14.stl).
- [거치부 STEP](out/tablet-cradle.step), [거치부 STL](out/tablet-cradle.stl).
- [블록 STEP](out/sticker-block-2x2.step), [블록 STL](out/sticker-block-2x2.stl).
- [진행 기록](../../docs/work/hardware/tasks/20261006-14x14-friction-cradle.md), [블록 기록](../../docs/work/hardware/tasks/20261006-sticker-block-2x2.md), [K480 조사](../../docs/work/hardware/tasks/20261006-tablet-cradle.md).
- 원본 NX 추출은 [tango-board-3d.mesh.json](../../packages/client/public/tango-board-3d.mesh.json). 기존 원본/인식기를 수정하지 않았다.

HTML의 `boardBase`는 반복 재생성을 위한 기존16×16 메시 원본, `meshData`의 현재14×14가 표시 대상이다. 이 캐시를 현재16×16 선택으로 오해하지 않는다. 기존 파일명을 유지해 열린 브라우저와 링크가 계속 작동한다.

## 검증과 아직 해야 할 일

CAD 판쉘·거치부는 각 유효한 단일 솔리드. 리브를 제외한 조립 본체 간섭0; 들림1mm/뒤로 당김3mm는 도브테일에 막히고, 옆 슬라이드20/100/230mm는 본체 간섭0. 마찰 리브의 의도적 교차부피6.48mm³는 압입 시안이며 실제 조립력을 증명하지 않는다. 가상240×8×170mm 태블릿 CAD 간섭0. STEP/STL 생성 및 STL watertight/winding, HTML JS구문, Chrome file:// 렌더를 확인했다. 라운드 경계의 면적0 STL삼각형은 생성 스크립트에서 제거하고 다시 검증한다.

**판쉘 STEP/STL에는 NX 돌기·미세 격자 표면이 아직 통합되지 않았다.** HTML은 별도 `grid` 메시로 원래 형상을 표시한다. 판쉘 STL을 돌기까지 완성된 출력판으로 취급하지 않는다. 다음 제작 작업은 이 표면을 제조용 CAD에 통합하고, 도브테일 공차 쿠폰/실물 조립력/태블릿 하중·넘어짐/아이 손에 닿는 촉감을 검증하는 것이다.

사용자가 카메라 버전으로 명명했지만, 새 교구의 카메라 거치·잠망경·화각·실시간 인식은 이번 작업에서 검증하지 않았다. 원래 [보드 카메라 인수인계](../../docs/handoff/board-camera.md)의 인식 흐름을 참조한다. 과거 판 일체형 태블릿 배치의 화각 실패가 이번 형상으로 해결됐다고 가정하지 않는다.

K480 공식 본체 두께20mm를 높이 기준으로 사용했다. 공식 사진에 대한 수직20~30°/깊이8~15mm 추정은 원근/가려짐이 있는 낮은 신뢰의 사진 추정이며 실측 아니다. 최종15°는 사용자 선택이 우선한다.

## 재생성 환경

이 PC는 Python3.12, CadQuery2.8/trimesh. CadQuery의 선택적 VTK 전체 import가 멈추는 문제가 있어, 이번에는 CAD/STL에 사용하지 않는 vtk를 실행 래퍼에서 빈 모듈로 등록했다. 파일 생성·검증 자체는 실제 실행했다. 다음 환경에서 일반 import가 정상이라면 `python hardware/studboard/tablet_cradle.py`로 충분하다.

```powershell
python -u -c "import sys,types,runpy;sys.modules['vtk']=types.ModuleType('vtk');runpy.run_path('hardware/studboard/tablet_cradle.py',run_name='__main__')"
python -u -c "import sys,types,runpy;sys.modules['vtk']=types.ModuleType('vtk');runpy.run_path('hardware/studboard/sticker_block_2x2.py',run_name='__main__')"
```

2026-10-06 사용자가 관련 코드·기록의 원격 main push를 명시 승인했다. 원격 반영과 Railway 배포 완료는 별도로 확인한다.

## 원격 전달

2026-10-06 관련교구코드·인수인계가원격main에일반push됐고원격SHA/로컬HEAD일치를확인했다(설계인수인계기준0d76a15a1). 전달상태기록도main에반영한다. Railway배포완료는미확인. 다른세션은최신origin/main과본파일에서이어간다.
