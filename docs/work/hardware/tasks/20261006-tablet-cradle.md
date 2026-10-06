# 격자판 위쪽 태블릿 거치 홈

- id: 20261006-hardware-tablet-cradle
- domain: hardware
- status: integrated
- updated: 2026-10-06
- base: 8b42702ff
- branch: main
- worktree: C:/project/tangobook
- integration: main 로컬 커밋
- delivery: 미푸시·미배포

## 요청과 완료 조건

사용자: 블루투스 키보드의 홈처럼 인식판 위쪽에 태블릿을 꽂을 공간 제작, 인터넷 사례 조사.

## 읽은 기억과 변경 범위

hardware BRIEF/MEMORY/인식판·블록 task, 기존 stand_simple.py, board-camera 인수인계의 진입 정보를 확인. 카메라 인식 변경은 없으며 과거판일체형거치의 화각실패를 이번 거치형상으로 해결했다고 주장하지 않는다.

## 조사와 결정

Logitech K480 공식 제품의 긴 후면 크래들 참조. 공식 지원은 두께10.5mm/폭258mm이며 실제 슬롯치수나각도는 해당페이지에 없음.
출처: https://www.logitech.com/en-ph/shop/p/k480-multi-device-wireless (VIEW AND TYPE)

우리 초안은 길이250mm/홈폭13mm/뒤로15도(수평75도). 위쪽y253~300에 270×47×26mm 거치부 추가, 기존판후단255와2mm 중첩. 전체270×315mm. 슬롯 바닥z6, 상단z26, 모서리R8/상단R2. 기존16×16격자와블록 보존. 홈폭13은 기종미정 상태에서 두께12mm이하를 염두에 둔 초기값이며 실제기종보장 아님. 비스듬한바닥부·끝라운드 때문에 꽂는 깊이/기종별끝모양 실측 필요.

사용자에게 태블릿모델/케이스두께 선택적질문 발송. 답변 전에도 가역적 시안 진행한다는 점 명시. 가상태블릿은240폭/8두께/170높이 예시이며 실제기종 아님. HTML의 태블릿 예시 버튼으로 보이기/숨기기, 기본은 숨김.

## 검증

CadQuery 단일유효솔리드/홈바닥재료·슬롯빈공간/가상태블릿CAD간섭0 확인. STL watertight/winding True. HTML JS구문검사 및 Chrome file:// 기본/태블릿예시 렌더 육안확인(tango-cradle.png,tango-cradle-tablet.png). 실제출력/하중/넘어짐/실기기착탈/카메라화각 미검증. STEP/STL은 거치부 단독, 판전체 일체형CAD로 보고하지 않는다.

## 실행·인계

hardware/studboard/tablet_cradle.py가 거치부STEP/STL 및 HTML cradle/tablet 메시를 갱신한다. 기존 CadQuery2.8의 Windows 선택적VTK import정지 때문에 앞선블록작업과동일한 vtk빈모듈/runpy실행래퍼로 생성했다. HTML보기UI는재생성시보존한다. 관련파일만로컬커밋, 원격push/배포없음.

## 다음 행동

태블릿 모델/케이스두께 답변이 오면 슬롯 폭·길이 조정, 사용각도 검토. 실제 제작 전 거치부와 판의 접합/하중/전도 안정성 확인.
