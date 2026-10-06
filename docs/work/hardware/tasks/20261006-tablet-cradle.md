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

## 후속: 인터넷 규격 조사·깊이 증가·기울기 감소

사용자: 기종재질문하지말고인터넷조사/딱맞출필요없음/살짝뒤기울임/쓰러짐감안해깊이증가. 이후15도과한지K480비교질문. K480공식각도수치없으므로 수직15=수평75를명확히설명하고 정확한K480각도는확인못했다고보고. 비공식50도리뷰는기술설계의확정근거로채택하지않음. Apple공식iPad10세대7mm(https://support.apple.com/en-asia/111840), Samsung공식A9 8mm(https://www.samsung.com/za/tablets/galaxy-tab-a/galaxy-tab-a9-wifi-gray-64gb-sm-x110nzaaafa/) 조사.

초안 홈길이260/폭13 유지여유·수직에서뒤로10도·수평80도, 삽입깊이약36mm(이전20)로변경. 거치부270×62×42mm, y253~315/전체270×330mm. 가상태블릿CAD간섭0/단일유효솔리드/STLwatertight·winding/HTML구문/Chrome예시렌더육안검수(tango-cradle-deep.png)통과. 넓은홈에서얇은태블릿실제각도는접촉위치따라달라짐. 깊이증가는하단지지개선안이며 실제하중/전도안정성/실물착탈검증완료 아님. 실기종맞춤요구는폐기, 실제출력검증후속.

## 최신 사용자 결정: 일체형·K480높이·15도

사용자지적: 판과거치부가따로보임/일체형이어야함(또는탈부착). 이어인식판높아도됨·K480높이정도 요청. 각도10도라고했다가최종15도로정정. 최신목표는 일체형외관/전체20mm/수직뒤15도. 이전42mm거치부·36mm삽입깊이·10도 결정을대체. 20mm높이에서바닥5mm남긴 홈깊이약15mm/260×13mm길이폭 유지. 원본격자8.1mm상승·놀이면13.0/베젤18.1/최대20. 블록위치도8.1상승(블록자체높이5.5유지). 후단베젤을잘라경사연결면과하나의board렌더메시로통합, 거치부별도색제거/전체270×330.

K480공식사진2·4를Chrome원격이미지페이지스크린샷으로육안확인(k480-photo2.png/k480-photo4.png). 공식측면사진 https://resource.logitech.com/content/dam/logitech/en/products/keyboards/k480/gallery/k480-gallery-black-4-new.png 의태블릿외곽선은화면상수직에서약27도(원근·카메라각보정없음)라 실제수직20~30도범위로낮은확신추정. 홈바닥은가려져깊이약8~15mm 저신뢰추정, 공식본체두께20mm를상한근거로참고. 실측/공식공개각도·깊이 아님. 공식20mm/820g출처 https://www.logitech.com/en-us/eol/keyboards-eol/k480-multi-device-wireless.920-006342.html . 사용자에게예전15도가과하다는가정과반대로K480사진은더누워보임을알림. 최종각도는사용자15도선택 우선.

단일거치연결부CAD유효/닫힌STL·가상태블릿간섭0·HTML구문·Chrome일체형예시육안검수(tango-integrated20.png) 통과. board메시는원본판/새하부/거치경사부를합친뷰어용시안으로공유내부면이남아있다. 전체일체형제조CAD·통합판STL워터타이트까지검증완료로확대하지않음. STEP/STL파일은거치연결부단독이며최종제작전판과의실제솔리드통합필요. 실제태블릿하중/실물전도/출력미검증, 원격push없음.
