# 한글 블록 사전 준비 병렬화

- id: 20261017-phonics-korean-block-preload-parallel
- domain: phonics
- status: complete
- updated: 2026-10-17
- base: a04788d96 (로컬 main), 원격11c10b489
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: a7304becc 로컬 main fast-forward 완료
- delivery: 2026-10-17 사용자 main push 승인, 운영 배포 확인은 별도

## 요청과 완료 조건

사용자가 한글 블록 사전 준비 시간을 줄이되 캐시·로딩 게이트를 유지하도록 요청했다. 기존 HTTP/SW 캐시·낱말 발음 정책·모든 core 준비 뒤 게이트/6초 상한·250ms 지연 UI·background 동화 준비·학습 데이터는 유지한다.

## 결정과 진행

- useGameAssetPreload는 모든 낱말 URL resolve가 끝난 뒤 그림·음절·모든 정답 음원을 워밍했다. 이미 URL을 아는 그림/음절도 가장 느린 concat 뒤로 밀리는 불필요한 순차 대기다.
- 같은 core effect 안에서 그림/음절을 바로 준비하고, 각 낱말은 자기 URL이 결정되는 즉시 음원을 준비하도록 병렬화했다. 다른 낱말 URL/음원이 끝나기 전에는 ready를 열지 않는다. 한글 블록이 사용하는 공용 훅이므로 영어/연결 게임도 같은 안전한 준비 순서를 쓴다.
- 같은 run의 동일 음원 URL은 Promise를 공유한다. 재진입 때 영구 warmed flag로 성공을 가정하지 않으며 실제 media 준비를 다시 확인한다(바이트는 기존 캐시 사용). 이미지/알려진 음절도 중복을 제거한다.
- 진행률 분모에는 아직 URL을 확인하는 낱말 작업도 포함해 URL 대기 중100%로 보이지 않게 한다. 실패는 best-effort 완료로 세고 이탈 후 늦은 resolve로 새 음원을 준비하지 않는다.
- coreKey에 TTS의 실제 단어/직접 URL/언어를 포함한다. 같은 개수/이미지지만 다른 단어일 때 새 준비를 누락하던 키 조건을 보완했다.

## 검증 진행

- 기존 게이트/수집기21+추가4=25검사 통과. 추가 검사는 느린 낱말과 독립 준비/음원 실제 준비 전 잠금, 동일URL 공유와 재마운트 확인, 실패/이탈, 같은 개수의 타깃 교체를 확인한다.
- 실제 Vite5193(기존 scheduler off 환경·운영 API proxy), 같은 kr-h1-u15 듣고 블록/model·같은 브라우저 캐시 유지·1280×720에서 첫 미계측 진입으로 워밍한 후 reload→자음 트레이 표시까지 측정했다. 전3003/2444/2817ms, 후2022/2001/2093ms. 각3회 중앙값2817→2022ms(약28%). dev/현재 네트워크·도구 관측이며 운영/완전 콜드/실기기 p95 성능 보장은 아니다. 원격 운영 측정과 섞지 않는다.
- 최초 테스트 실행은 테스트 fixture 선언 순서 오류로 실패했고 선언 순서를 고쳐25검사 통과했다. 제품 실패가 아니다.

## 다음 행동

추가 최적화 시 실제 콜드·운영 배포 후 표본/미디어 구간별 시간을 분리한다. 새 push 요청은 없으며 운영 배포 성공을 이 로컬 변경 결과로 주장하지 않는다.

## 최종 검증·통합

- 인접7파일 **53검사**, 클라이언트 typecheck·변경 ESLint·production build 통과. 기존 Browserslist·i18n mixed import·lottie eval·큰 chunk 경고 유지.
- 캐시가 더 데워진 상태에서도 원본/개선 교차 비교: 원본3500/3084ms, 개선3055/3004ms. 앞선3회 포함 각5회 중앙값 **3003→2093ms(약30%)**. 교차2회만의 감소폭은 작았고 전체 시간의 네트워크 편차가 있으므로 매 진입0.9초/30% 단축을 보장하지 않는다. 원본 교차검사는 변경 파일을 별도 보존한 뒤 해당 파일만 HEAD 내용으로 바꾸고, 끝나자 검증된 개선 파일과 정확히 동일하게 복구했다. build/type/lint 뒤 제품 최종 내용 추가 변경 없음.
- 한글 실제 듣기 버튼→입력 활성→ㅎ 고르기→판에 배치(되돌리기 활성)→되돌리기 정상. 알파벳 블록도 gate 뒤 실제 진입·듣기 버튼 연결 확인. 게이트 시간은 플레이어 표시까지이고 듣기 안내의 의도적 발음 시간은 별개다. 전체 정답/챕터 완주는 이번 범위 아님.
- 현재 브라우저의 캐시·학습 기록을 지우지 않았다. screenshot/timings는 root output/preload-parallel-20261017에 저장, 원본 교차 복구용 파일은 worktree output 아래 미추적 보존한다. React Router dev future 경고는 기존이며 새 제품 오류로 해석하지 않는다. 실제 스피커/실기기 검수는 아님.
- a7304becc 코드·검사·기억을 함께 커밋하고 로컬 main fast-forward 완료했다. 커밋 훅 ESLint/Prettier 통과, 관련 없는 output/tmp·다른 작업 폴더는 보존했다. 새 push/배포 없음.

## 메인 푸시 요청

- 2026-10-17 사용자 “좋아. 메인에 푸시하자”로 이번 최적화의 main push를 승인했다.
- fetch 후 origin/main 대비 0/4, main 추적 파일 clean·diff check 통과. a7304becc 구현과 ad2a1db00 통합 기록, 앞선 a04788d96 로딩 감사·de7a674ef 운영 검수 문서가 전달 범위다.
- 기존 53회귀·타입·변경 lint·production build 검증 이후 제품 코드 변경 없음. 관련 없는 output/tmp·다른 worktree는 보존하며 일반 push 뒤 원격 SHA를 확인한다. Railway 배포/운영 검수는 별도다.
