# 탱고 카메라 판 단독 출력·하부 개방

- id: 20261007-open-bottom-board-print
- domain: hardware
- status: ready
- updated: 2026-10-07
- base: 942357fe
- branch: codex/hardware-periscope-redesign
- worktree: C:/projects/tangobook/.worktrees/periscope-redesign
- integration: 작업 브랜치
- delivery: 로컬 출력 파일, push 요청 없음

## 요청과 결정

사용자는 거치대를 제외한 판만 STL로 요청했다. 이어 두꺼운 내부의 출력 방법을 질문하고 아래를 개방하는 방향을 선택했다. 특정 태블릿 모델/치수/무게는 정해지지 않았다. 아래 개방으로 판 무게가 줄어 전도 검토가 필요하며, 특정 기종 안정성을 보장하지 않는다. 거치부 치수는 이번 변경에 포함하지 않는다.

## 구현

기존 recognition-board-14x14.stl은 격자 돌기 없는 판쉘이다. HTML의 원본 NX 격자는 열린 표시용 메시라 그대로 STL에 이어 붙이면 닫힌 솔리드가 되지 않는다. `hardware/studboard/board_print.py`는 내부 한 칸의 실제 표시표면을 수직 ray로 0.25mm XY 간격 샘플링하고 반복 경계를 평균하여 닫힌 높이표면으로 재구성한다. CAD쉘과 Manifold Boolean 합집합 후 아래 공동을 뺀다. 원본 NX STEP 복원이 아니며 미세 표면은 샘플 근사이다.

판240×250.13×20mm(후방 레일 포함), 14×14/15mm피치 유지. 놀이면 아래 명목2.2mm, 외벽3mm/베젤천장3mm, 하부30mm피치·폭2mm리브를 남겨 큰 판을 지지한다. 리브 아래끝은 바닥에서4.4mm 올라가며 리브 사이 하부는 열린다. 거치대/블록/태블릿/생성서포트는 STL에 없다. 출력 방향은 놀이면을 아래로 뒤집고 Z최소0; 돌기/홈 아래 서포트 필요. A1의256mm정방 베드에 가깝기 때문에 큰 브림 여유는 적다. 실제 슬라이싱/출력/리브강도는 미검증.

기존 HTML의 board만 동일 하부 개방쉘로 갱신하며 grid/cradle/block/tablet 및 원본boardBase는 보존. `tablet_cradle.py`는 원래 판쉘을 재생성하므로 전체 재생성 순서는 tablet_cradle.py 이후 board_print.py이다. 생성 STL은 약70MB라 Git에서 제외하고 생성기/보고서/뷰어/기록을 남긴다.

## 검증

생성 종료0: STL 단일닫힌바디/정상와인딩, 하부(15,15,1)공동과(15,15,10.8)놀이면존재 검사통과. 1,429,708삼각형/약71.5MB, 원점위Z최소0/놀이면아래 출력방향. HTML의5부품 데이터 유지 및 node --check, Python구문 검사통과. 하부 메시 렌더에서 개방공동과교차리브 확인. 재생성한 원본표면 근사는0.25mm이며 최대샘플높이15.49mm(표시원본15.5mm). 실출력/전도하중/카메라화각 검증 없음.

## 전도 검토

최종축소검증: 생성기두개종료0, 새판·거치대CAD단일솔리드/명목결합간섭0·마찰리브6.48mm³·들림/뒤당김포획·20/100/230mm옆분리·예시태블릿간섭0. 하부개방STL226×236.13×20mm,153,360삼각형·단일닫힌바디/하부공동/놀이면존재 검사통과, JS/Python구문통과. 원본표면표시데이터/기존샘플링 유지하고최종STL만0.01mm허용단순화. Downloads에새이름 `tango-camera-board-bezel8-open-bottom.stl` 복사, HTML치수/8mm베젤/다운로드파일명 갱신. 이전큰파일은다운로드폴더에보존되므로 새이름을명확히안내. CAD/메시검사이며 실제슬라이싱시간/출력/전도는미검증.

2026-10-07 슬라이서 경고·베젤 축소: 사용자 Bambu Studio 화면에서1,429,708삼각형 경고 및 베드여유 부족을 확인했다. 베젤15→8mm, 놀이면210mm/14×14 유지. 판쉘226×226, 후방레일포함 약226×236.13mm. 도브테일 단면/210mm길이/공차/리브 유지하고 판뒤변과함께7mm전방이동, 뷰어거치대폭226·전체깊이286으로동기화. 하부공동/리브범위도좁은판에맞춘다. 기존넓은거치대의레일규격은같지만외곽은7mm씩더넓다. Manifold simplify(.01)로표면이동0.01mm이내에서평면/곡면중복삼각형을줄이고300,000개미만/단일닫힌바디/경계변화0.03mm미만을검사한다. 생성기와다운로드STL/뷰어재생성중. 단순화시험 .02mm는140,480삼각형이었고최종은더작은 .01mm오차를사용한다.

2026-10-07 후속 HTML 명시갱신 요청: 하부개방/놀이면2.2mm/리브표시와 판단독STL 다운로드링크를 헤더에 추가, `#bottom` 초기뷰 지원. 링크대상실제파일과JS구문 확인. STLgeometry 추가변경 없음. 다운로드요청으로 사용자Downloads에도 `tango-camera-board-only-open-bottom.stl` 복사했다.

현재 거치부는 뒤끝Y285mm, 예시태블릿 중심Y약272mm(높이170mm/수직뒤15°). 가정높이300mm에서는 슬롯기준 단순중심Y약288.8mm가 되어 거치대뒤끝 밖이다. 전체 전도는 판·거치대·태블릿의 합성무게중심 및 손누름힘으로 판단해야 한다. 판만 가벼워졌다고 곧바로 들린다고 단정하지 않는다. 범용안은 거치대뒤쪽바닥확장이 효율적이나 사용자 치수변경 승인/구현은 이번에 없었다.

사용자 인터넷조사 요청: 2026-10-07 제조사 공식 Wi-Fi 사양 [iPad mini](https://www.apple.com/ipad-mini/specs/)293g, [iPad A16](https://www.apple.com/ie/ipad-11/specs/)477g, [iPad Air](https://www.apple.com/ipad-air/specs/)11인치464g/13인치616g, [Galaxy Tab S11/Ultra](https://news.samsung.com/uk/meet-samsung-galaxy-tab-s11-series-packing-everything-you-expect-from-a-premium-tablet)469g/692g를 확인. 11인치급약460~480g·대형약620~700g 표본이며 시장전체 통계가 아니다. 케이스 포함1kg은 검토용 가정으로 제안했고 실제허용하중/시험통과라고 주장하지 않는다. agent-reach 검색지침을읽었으나mcporter부재로기본웹검색을사용했다.
