# 스마트폰 반사경 외형·조립 재설계

- id: 20260922-periscope-redesign
- domain: hardware
- status: ready
- updated: 2026-09-22
- base: 897960145
- branch: codex/hardware-periscope-redesign
- worktree: C:/projects/tangobook/.worktrees/periscope-redesign
- integration: 미통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

사용자: 기존 반사경이 예쁘지 않고 조립을 고려하지 않았다. 외형과 실제 조립 구조를 수정한다. CAD 시안·조립 순서·치수와 간섭 검사 결과를 함께 제공한다. 실물 출력은 별도 검증이다.

## 읽은 기억과 변경 범위

hardware BRIEF/MEMORY, 루트 CLAUDE 반사경 절, 기존 periscope-reflector 메모리, printable.py/plate.py/review.py. 과거 deploy-board3d의 출력물은 보존한다. 최신 main의 printable.py는 35×20×1.1mm 거울이고 과거 메모리의 17×11mm는 구버전이다.

## 결정과 진행

- 현재 거울·33도 광학 배치를 기준으로 한다. 둥근 외피와 좌우 분할 케이스를 시안으로 개발한다.
- 기존 몸체는 채널을 전폭으로 제거한 뒤 핀 구멍만 뚫는다. 독립 축 지지대가 없으며, 거울 삽입구를 막는 구조도 없다.
- 사용자 확정: 둥글고 매끈한 조약돌형. 추가 지시: 나사 없이 프라모델처럼 플라스틱 끼움 결합.
- 나사 설계는 폐기했다. 최종 시안은 정렬 핀 2개와 내부 스냅 2개, 아래쪽 해제 구멍으로 결합한다.
- 좌우 케이스·직선 누름판 3개, 구매 거울·폼. 거울 홈과 축 받침을 케이스 분할면에서 조립한다.
- 기존 곡선 누름판은 롤 끝을 폰 두께에 맞춰 돌려도 몸통이 폰을 침범했다. 폼을 스프링으로 쓰는 현재 구조에 맞게 직선 강체 판으로 수정했다.
- 기존 축 정렬 원뿔은 거울 고정 테두리까지 지웠다. 실제 경사진 반사면의 모서리에서 광선을 반사시켜 광학 통로를 만들고 독립 표본 광선으로 확인했다.
- 사용자가 거울 종류를 질문했다. 전면 반사경·가시광용 보호 알루미늄·35×20mm를 안내했다. 1.1mm는 구매 확정이 아닌 CAD 기준. 정확 규격 재고/가격은 미확인. 근거와 구매 문의 사양은 PEBBLE.md.

## 검증

`python hardware/periscope/pebble.py`: 최종 report pass=true. 단일 솔리드, 강체 간섭·표본 조립 경로·처방 변형 스냅 경로·7/9/11mm 폰 모형·9개 광선 검사 통과. 거울 6방향 이동 시 걸림 확인. `trimesh`: 출력 부품과 시험 부품 5개 모두 워터타이트·연결체 1개. py_compile, git diff --check 통과. 실제 출력/착용·피로·고정력 미검증. 상세 수치/검사 한계는 hardware/periscope/PEBBLE.md.

실제 STL 기반 review-board.png를 눈으로 확인했다. 나사 구멍 없음, 조립/분해/하부/내부 4개 뷰. Windows VTK의 성공 렌더 후 인터프리터 종료 시 native teardown 오류가 관찰되어 이미지 저장 완료 후 정상 종료하도록 미리보기 엔트리에서 명시 처리한다. CAD 검사 오류를 감추는 처리는 아니다.

## 다음 행동

사용자 외형 검토 → 구매 거울 실제 치수 확인 → 작은 결합 시험 부품 출력 및 간극 조정 → 본체 출력 방향/서포트 검토 → 실제 폰 장착과 카메라 영상 확인.

## 인계·통합

전용 worktree에 코드·기록을 로컬 커밋한다. main 통합·push 없음. 출력 STEP/STL·미리보기·검사 보고·zip은 hardware/periscope/out/pebble/ (gitignore). 생성 스크립트로 재생성 가능하며 기존 deploy-board3d 산출물은 보존했다.
