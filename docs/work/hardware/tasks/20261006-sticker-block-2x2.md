# 16×16 탱고 격자판용 2×2 스티커 블록

- id: 20261006-hardware-sticker-block-2x2
- domain: hardware
- status: integrated
- updated: 2026-10-06
- base: 96de5f229
- branch: main
- worktree: C:/project/tangobook
- integration: main 로컬 커밋
- delivery: main push 완료·배포 미확인

## 요청과 완료 조건

현재 판 위에 놓을 2×2칸 블록. 아래는 돌기 회피 홈, 위는 평평한 스티커 자리와 올라온 테두리, 둥근 모서리. 기존 HTML에서 판 위 조립과 블록 위/아래를 확인한다.

## 읽은 기억과 변경 범위

hardware BRIEF/MEMORY 및 인식판 작업 기록, studboard.py의 원본 돌기 실측, lrrh/sticker_block.py의 스티커 턱 규칙을 참조했다. 기존 레고8mm 규격은 사용하지 않는다.

## 결정과 진행

15mm 피치의 2×2칸: 블록29.6×29.6mm(칸마다 한쪽0.2mm 여유), 높이8mm, 모서리R3. 아래9개 교점(-15/0/15mm)에 반경2.85mm·깊이3.2mm 회피 홈; 중앙1/변4/귀퉁이4. 스티커 자리27.6mm, 턱 폭1mm/높이0.8mm, 외측 상단R0.35. 원본돌기반경2.5/높이2.5mm보다 홈반경0.35/깊이0.7 여유. 바닥은판놀이면z4.9에 배치. 최대 홈깊이와 스티커 바닥 사이4mm 살 유지.

## 검증

CAD 유효성/단일솔리드/치수/중앙홈/스티커바닥/턱 검사 통과. 9개 반경2.5mm 돌기(원본 메시의 x오프셋0.05mm 포함)와 CAD 교차부피0. STL watertight/winding 모두True. Chrome file:// 판위/블록위/블록아래 렌더 육안확인. 물리 출력 맞춤은 미검증.

## 다음 행동

HTML 새로고침 후 블록 위/아래 버튼으로 확인. 실물 출력 시 공차 확인.

## 실행 환경과 결과

Python312에 CadQuery/trimesh 설치. 이 환경 CadQuery2.8의 선택적 VTK 전체 모듈 import가 멈춰 진단 프로세스만 종료했다. CAD/STL 생성은 실행 래퍼에서 vtk를 빈 모듈로 등록하고 runpy로 생성 스크립트를 호출해 선택적 시각화 import를 우회했다(저장소 훅 우회 아님). STEP/STL/형상 검사와 HTML 메시는 실제 생성 완료. 결과는 hardware/studboard/out/sticker-block-2x2.step 및 .stl. 스크립트 재실행은 HTML의 block 데이터만 갱신하며 보기 UI는 유지한다. 베젤과 격자 메시 보존. 기존 HTML에 판위조립/블록단독위/아래 보기 추가. 검수이미지는 Codex visualizations의 tango-block-top.png, tango-block-bottom.png. 소켓은 원통형 회피홈이며 중앙은 blind, 경계는 열린 홈이다. 실제 끼움시험/출력은 하지 않았다. 원격 push/배포 없음.


## 후속: 닫힌 옆면·낮은 높이

사용자 지시로 옆면 열린 홈 제거·높이8→5.5mm. 블록을 판에서 반칸(7.5mm) 이동하여 내부2×2돌기 위 배치, 바닥 blind 소켓4개(±7.5mm)로 변경. 29.6mm 발자국 유지, 홈깊이3.2/스티커턱0.8/홈위살1.5mm. 사방옆면하단 재료검사·CAD단일유효솔리드·4돌기간섭부피0·STLwatertight/winding 통과. Chrome 아래보기 육안검수(tango-block-closed-bottom.png), 표시높이 갱신. 기존9홈경계배치 결정을 대체. 실제 출력 미검증/원격push 없음.

## 후속: 바닥 원복·5.5mm 유지

사용자 정정으로 내부4소켓/반칸이동 배치를 폐기하고 원래 중앙·변·귀퉁이9돌기 회피홈 및 중심120mm 배치로 복원. 높이는5.5mm 유지. CAD단일유효솔리드/치수/홈위살1.5mm/9돌기간섭0/STLwatertight·winding/HTML구문/Chrome아래보기 육안확인(tango-block-restored-bottom.png) 통과. 기존 닫힌옆면 요구는 이번 바닥원복 요청으로 대체. 실출력·push 없음.


## 2026-10-07 블록 밑면 라운딩

사용자가블록실물은딱좋다고확인후밑부분둥글게요청. 바닥외곽R0.5/9개홈입구R0.5. 홈입구아래0.5mm만넓어지고그위반경2.85/깊이3.2·발자국29.6·높이5.5·윗스티커포켓은유지. 겹친홈절단후일괄fillet은CAD실패또는STL열림발생해폐기; 최종은바닥라운딩후XZ원호회전커터로각소켓둥근입구를직접생성. 단일유효CAD/닫힌단일STL·기존9돌기교차0·JS/Python구문확인. 출력메시0.01mm단순화, 최종6948삼각형; CAD원본STEP보존. Downloads tango-camera-block-2x2-rounded-bottom.stl, HTML블록메시/최종HTML갱신. 기존판/거치대변경없음. 라운딩후실물촉감은재출력미확인.


## 2026-10-07 1×2 블록 추가

사용자1by2요청. make_block(cols=2,rows=2) 파라미터화·기존2×2기본보존, sticker_block_1x2.py추가. 14.6×29.6×5.5mm/15mm피치,홈6개(X±7.5,Y−15/0/15), 반경2.85/깊이3.2·외곽R3/하단외곽및입구R0.5·윗턱폭1/높이0.8, 스티커자리12.6×27.6. CAD단일유효/치수검사, 현판돌기를감싸는반경2.5/높이2.9원통6개와교차0. 출력STL0.01mm단순화4,368삼각형/닫힌단일바디·바닥Z0, JS/Python구문검사. 실제프린트끼움은아직미검증.

HTML판위중심67.5,105/바닥13mm에추가표시, 1×2위/아래단독버튼추가·기존2×2표시보존. Downloads tango-camera-block-1x2-rounded-bottom.stl, 최종HTML갱신. 1×2재생성은python hardware/studboard/sticker_block_1x2.py(현재환경vtk선택적모듈래퍼)이고2×2도공통make_block사용.
