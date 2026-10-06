# 16×16 탱고 격자판용 2×2 스티커 블록

- id: 20261006-hardware-sticker-block-2x2
- domain: hardware
- status: integrated
- updated: 2026-10-06
- base: 96de5f229
- branch: main
- worktree: C:/project/tangobook
- integration: main 로컬 커밋
- delivery: 미푸시·미배포

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
