# 누르기 충전과 획순 따라쓰기

- id: 20261015-tap-charge-stroke-writing
- domain: phonics
- status: ready
- updated: 2026-10-15
- base: b14e8dc12
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 사용자 결정

입문 모음 누르기는 탭마다 차오르는 액션 후 전체 완료 액션. 후속으로 **5번** 확정. 면을 칠하는 쓰기는 철회하고 정해진 획순을 대략 따라오면 해당 획 전체가 채워지는 방식으로 변경한다. 기존 낱자 경로를 재사용하며 합성·받침·낱말 색칠 쓰기까지 자동 확대하지 않는다.

## 진행

기존 single 모음3카드/3회 듣기와 99% 면 채움 확인. 같은 작은 글자 여러 장보다 큰 하나의 글자+5단계 충전으로 행동과 피드백 연결. 음원 실패/연타/시범 구경은 완료로 기록하지 않는다. 한글 낱자40종의 기존 폰트 정렬 경로와3회 시범→힌트→독립 연습을 보존한다.

## 검증

- 파닉스 및 기존 마스크 회귀53파일460검사 통과. 마지막 단순 renderer 정리/안내 음성 정정 후 관련2파일11검사 재통과. client 타입·변경 TS/TSX ESLint·최종 production build20.70초 통과. 기존 Browserslist/lottie eval/i18n 혼합 import/큰 chunk 경고 유지.
- 시범/다시 보기·다음 획 먼저·취소·점/역방향/반쪽/지름길은 완료 없음, 두 획 후 한 번만 완료, 늦은 폰트·이탈 취소·독립 안내 제외를 회귀로 확인.
- localhost:5187 별도 origin에서 실제5번 듣기/충전→기존 쓰기 진입, ㅏ의 세로/가로 획을 native drag로3회 모두 완료하고 발음 후 새 종이/마지막 자유 지도 복귀 확인. 기존127.0.0.1 사용자 진도는 수정/초기화하지 않음. localhost도 과거 검수 진도가 있어 새 커리큘럼 잠금 해제 검증으로 주장하지 않는다.
- 첫 음원 실패는0/5 유지+재시도 후1~5 정상. API 라이브러리·ㅏ mp3 HEAD200 확인. 새 오디오 생성/원격 데이터 수정 없음.
- 1280×720 기본 화면/568×320 작은 가로의 실제 입력·버튼/종이 정렬,1024×768 태블릿의 ㄱ 가이드·레이아웃 확인. ㄱ 대각선 지름길 native drag는 진도0/재시도 안내 유지. 꺾인 성공 경로는 순수 입력 검증으로 확인했고 UI 전체 ㄱ 완주는 하지 않았다.40종 전부 실기기 쓰기/FPS 측정은 아니다.
- 그림 높이가 부모보다 길어지던 첫 시안은 자모 absolute 고정으로 바로잡고 최종 화면 재확인. 시범/폰트는 기존 자산, 새 엔진·이미지 다운로드 없음. 폰트400px mask/획 영역 배분은 초기화 시1회, 이동 중 pixel read 없음.
- 증거: output/tap-stroke-20261015/tap-four-of-five.png, tap-complete.png, writing-small-first-stroke.png (로컬 미커밋). viewport 최종 복원.

## 인계

코드/기록 로컬 커밋 후 main 통합 예정. 이번 새 변경 push/배포 요청은 받지 않았다. 기존 영어 LetterFillCanvas와 합성/받침/낱말 쓰기99% 기준은 보존한다.
