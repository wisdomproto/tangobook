# 탱고 카메라 버전 — 교구 설계 인수인계

2026-10-06 사용자 명명: **이 교구는 탱고 카메라 버전**. 다른 세션에서 이 문서부터 읽고 이어간다.

## 최신 전도 보완 — 2026-10-07

[전도 보완 생성기](tablet_stable_cradle.py): 기존홈/레일 유지, 뒤쪽4mm받침45mm연장(뒤접지선322.4), 7mm태블릿용내폭7.4 U패드2개. 패드는15도경사로위에서삽입, 두꺼운태블릿에는제거. 전체226×331mm. 기존판/다리는재사용하고거치대·패드만교체. HTML의새거치대·패드STL버튼, Downloads `tango-camera-stable-cradle-with-liners.stl`(13,922삼각형/한판226×128.12mm). 제조용 STL에는서포트가들어있지않으며암레일내부슬라이서설정확인필요.

새정적검토는iPad477g/가벼운출력물134g가정에서세로15도뒤여유63.89mm/상단뒤밀기임계1.55N(미끄러짐제외). 패드포함표본에서15도간섭없음/17도이상막힘. 실제충격·유지력·출력촉감미검증. 재생성은기초tablet_cradle.py → tablet_stable_cradle.py → flat_board.py → board_stability.py. 아래기록은과거안을포함하며최신절우선.

## 최신 연결부 보완 — 2026-10-07

레일에 남았던 뾰족한 세로 띠를 제거하고 R1.2의 순수 레일로 교체했다. 판도 위R1/아래R0.8로 새 생성. 다리 핀은 3줄 마찰리브와 둥근 끝·Ø4.8×6mm, 소켓Ø4.92/입구0.5mm. 기존 거치대는 재사용하고 판·다리를 새로 출력한다. 판22,472/다리레일26,984삼각형, CAD결합/닫힌STL확인, 실끼움힘·촉감 미검증. 다운로드 새이름은 `tango-camera-flat-board-rounded-fit.stl`, `tango-camera-board-feet-modelkit.stl`.

## 최신 출력안 — 2026-10-07

기존 하부 개방형을 평평한 판 + 모서리 다리 조립형으로 대체했다. 판226×225.35×9.6mm/18,804삼각형, 앞 다리2개 + 뒤 다리2개와 레일 일체 받침20,736삼각형. 다리 높이10.4mm로 조립높이20mm 유지하며 기존 거치대 규격은 유지한다. 돌기는 R2.5·높이2.9·15mm피치를 유지한12각/3띠 근사로 새로 만들었고 원본 미세 격자홈은 생략했다. 기존 블록간섭0/닫힌STL/평평한 밑면 확인, 실조립·하중 미검증.

[생성기](flat_board.py), [검증 보고서](out/flat_board_report.json), [상세 기록](../../docs/work/hardware/tasks/20261007-open-bottom-board-print.md). HTML의 판/다리 STL 버튼을 사용한다. 판은 평평한 밑면을 베드에 두고 출력한다. 뒤 다리/레일 받침은 국소서포트가 필요할 수 있다. 전체 재생성 시 tablet_cradle.py 다음 flat_board.py를 실행한다. 아래 표의 인식판20mm는 다리를 포함한 조립치수다.

## 현재 최종 선택

| 항목 | 치수·구조 |
|---|---|
| 격자 | 14×14칸, 피치15mm, 안쪽210×210mm |
| 인식판 | 베젤8mm, 판226×226×20mm, 후방레일 포함226×236.13mm, 외곽 모서리R15 |
| 조립 전체 | 판과 거치부226×286mm, 본체 높이20mm(태블릿·블록 제외) |
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

2026-10-07 베젤15→8mm 축소 및 STL 경량화 후속: 놀이면210mm 유지, 판/거치대 폭226mm·레일/거치대Y위치7mm전방 이동. 도브테일 단면·210mm레일길이·공차는 유지하여 기존 넓은 거치대도 동일레일이나 양옆7mm돌출한다. 판 단독STL153,360삼각형/약7.67MB, Manifold표면이동허용0.01mm·단일닫힌바디/하부공동/놀이면존재 검사통과. 기존143만삼각형파일대신다운로드폴더의 `tango-camera-board-bezel8-open-bottom.stl` 사용. CAD거치대결합/들림·당김포획/옆분리/예시태블릿간섭검사통과, 실출력미검증.

2026-10-07 출력판 후속: [하부 개방 판 단독 기록](../../docs/work/hardware/tasks/20261007-open-bottom-board-print.md). `python hardware/studboard/board_print.py`로 격자 돌기까지 포함한 `out/tango-camera-board-only-print.stl` 생성. 기존 CAD쉘 STL과는 다른 출력용 메시이며 열린 NX표면을0.25mm높이샘플로 닫아 합친 근사이다. 아래는2mm교차리브/30mm피치로 개방, 놀이면2.2mm·외벽3mm 유지. 놀이면아래 방향·서포트 필요, 실출력/전도검증은미실시. HTML도하부개방쉘로갱신되며 원본 grid는보존. tablet_cradle.py를재실행하면원래쉘로돌아가므로 그후 board_print.py를실행한다. 거치대치수는변경하지않았다.

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

## 전도 검토 — 2026-10-07

[계산기](board_stability.py), [결과](out/board_stability_report.json). iPad A16 Wi-Fi477g를기준으로15도정적평형은가로/세로통과. 그러나7mm두께/13mm홈은각도고정이아니며30도간섭없는자세표본에서가벼운출력가정의전도가능성이확인됨. 실제출력무게/안착각/핀유지력은미측정. 뒤지지확장·홈패드검토필요, 현설계의안전통과선언을하지않는다. 상세가정은task최신절.

- 2026-10-07 [거치 홈 실출력 수정](../../docs/work/hardware/tasks/20261007-open-bottom-board-print.md): 기존판재출력부담으로원래4mm다리복사제공. 사다리꼴끼움실패반증에거치대암홈만면당0.10→0.35mm/입구0.65mm확대. 기존판·다리·패드재사용/거치대만교체, CAD진입0·포획유지·닫힌STL/JS검사통과. 실제끼움/옆방향유지력미검증.

- 2026-10-07 [실물눕힘반증·높은등받이](../../docs/work/hardware/tasks/20261007-open-bottom-board-print.md): 오스모사진참고/사용자승인으로15°등받이높이85mm·뒤보강2개추가. 기존판/다리/레일재사용·U패드사용안함/거치대만교체. CAD삽입·뒤회전방지표본/닫힌STL/JS검사,실물각도·전도·유지력미검증. 최신생성기tablet_backrest.py/새보고서backrest_report.json.
