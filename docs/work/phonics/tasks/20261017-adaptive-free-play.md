# 한영 자유놀이 즉시 시작·도움과 맞춤 출제

- id: 20261017-adaptive-free-play
- domain: phonics
- status: completed
- base: 71bd87d01
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 새 push 요청 없음

## 현재 사용자 결정

- 블록 놀이/듣고 블록 놀이 입구를 통합하고 내부 도움/난이도를 조절. 낱말 쓰기도 내부 도움.
- ‘따라 그리기’는 실제 선 그리기가 아니라 polygon 채움→삽화 reveal임을 코드로 확인·설명했다. 사용자가 색칠하기의 하위 기능이라 자유모드에서 제거 요청.
- 내용 dialog를 다시 고르게 하지 말고 버튼 한 번→랜덤 직접 시작. 최종 후속은 커리큘럼/자유 데이터 합산해 능력에 맞는 내용과 도움, 기록 없으면 가장 쉬운 단계.
- 블록 전체보기/첫 글자/소리만. 낱말 쓰기의 소리만 받아쓰기는 기존 면채움 판정으로 독립 능력을 주장하면 안 된다. 확인 질문에 사용자가 ‘자유쓰기 인식 가능?’이라고 문의했고, Google Cloud Vision 공식 손글씨 문서를 확인해 가능하나 유아 표본 검증 필요·인식 불확실 시 힌트/재시도라고 설명. 새 OCR 구현/공급자/아동 이미지 전송은 아직 하지 않았다. 쓰기는 현재 전체/한 글자 가이드 도움까지만 구현, 독립 평가 아님.

## 진행

- 자유4입구: 그림짝/블록/쓰기/색칠. dialog·권/단원 선택 제거. 실제 plan의 단원 안 낱말·scope/기존 엔진으로 직접 실행. 영어 Book1 블록·전체 낱말쓰기 제외 유지.
- adaptive-free-play 순수 규칙: 해당 언어/실제 단원 이벤트 ID 중복 제거, 실제 연습 단원/완료 단원부터 주변 범위 랜덤.3회 연습/성공 뒤 첫 글자, 여러 낱말6성공 뒤 듣기 도전, 힌트 없는 첫시도3회·2타깃이면 인접 한 단원 도전, 최근2오답이면 해당 범위 전체 도움. 임상 능력 점수/숙달 선언 아님.
- 로그인은 기존 learning-events query/API 및 해당 child pending+ACK 기록을 병합, 게스트는 미귀속 guest 기록만 읽음. 프로필/언어 변경 시 늦은 요청 무효화, 조회 실패는 현재 child 로컬 근거와 보수적 시작. 중복 클릭 방지.
- 한영 listening block 공통 hook이 초기 도움·화면 내 도움 선택을 지원한다. 도움을 가려도 같은 문항 hintUsed 유지, 새 문항만 초기화. 전체 정답 노출/modelVisible과 독립 여부는 실제 metadata에 남김.
- writing 가이드는 캔버스/입력 셀/잉크/판정을 리셋하지 않고 전체 낱말을 드러냄. 연습 완료·independent=false 유지.

## 검증 진행

- 초기 관련5파일43검사 통과. 후속7파일61검사 중 ConnectedWordLearningActivity 테스트14개가 새 Router 의존 때문에 실패했고, URI 처리를 상위로 옮겨 props 전달로 수정. 해당14개+새 도움/맞춤 포함3파일25검사 통과. 다른6파일47검사 통과 결과는 최초 실행과 구분한다.
- 실제 localhost5193 한글4버튼→블록 단원선택 없이 kr-h1-u02, support=model·고기 정답/도움선택 직접 확인. 최종 화면/전체 회귀 결과는 완료 시 추가한다.

## 실제 검수·범위

- 관련12파일87테스트 통과, active child 원격/기기 병합·중복 시작·교체 stale/오프라인 scoped fallback 신규4검사 통과. 이후 무작위 쓰기/색칠 deck가 기존 cursor를 덮지 않도록 보완, connected/run2파일22검사 통과(중복 수 합산하지 않음).
- client build49.68초 통과, 기존 Browserslist/lottie eval/static·dynamic import/large chunk 경고만 남음. 변경 source lint 오류0·기존 한국어 player 미사용2경고. 최종 타입/소스 포맷 결과는 완료 시 추가.
- 실제 한글4게임 직접 진입: 블록 kr-h1-u02 고기·전체/첫 글자/소리만 전환, 쓰기 아기 전체 보기/숨기기, 그림짝4개와 색칠 아기. 영어 block en-b2-u08 cut·도움 전환/쓰기 en-b3-u01 진입. 이 게스트 브라우저에는 기존 학습 기록이 있어 영어 단원이 첫 단원과 달랐다. 무기록 최저 단원은 순수 테스트로 확인했다. 로그인 실제 가족 이력/전체 게임 완주·실기기·청취 전수 검수 아님.
- 자유 무작위 쓰기/색칠은 매 진입 새 shuffle deck, 이탈/새로고침은 새 판이다. 기존 단독 복습/커리큘럼 이어하기 cursor와 분리한다. 실제 연습 event/ledger는 그대로 누적한다.
- 부모 추천의 임상적 점수/검사나 서버 lifetime projection은 아님. 최근 최대8개 관련 근거로 보수적 단계 조절, 기존 fetch cap50000/guest cap2000 한계를 물려받는다. 기존 색칠/노출·legacy 무정보 기록을 독립 성취로 소급하지 않는다.
- 자유 손글씨 가능성 근거: Google Cloud Vision 공식 https://docs.cloud.google.com/vision/docs/handwriting . 손글씨 OCR 가능성과 유아 한글/영어 판정 품질은 다르며 샘플 검증·확신 낮은 경우 재시도/힌트 설계 필요. 새 OCR 공급자/외부 아동 이미지 전송/채점 기능은 구현하지 않았다.

## 최종 확인

- 최종15파일103테스트 모두 통과. 뒤이어 guest 중복 클릭 차단4검사, 도움 받은 블록의 metadata를 practiceCompleted/learningMode=practice로 분리하고 중복 이벤트 이중 집계를 없앤 뒤 관련3파일22검사 재확인 통과. 실습 반복은 다음 도전의 근거이며 독립 숙달 판정으로 승격하지 않는다.
- 최신 client typecheck 통과, 변경 source lint 오류0/기존 K player 미사용2경고. build49.68초 통과(후속 fresh deck/기록 분리 순수 로직은 관련 회귀로 추가 확인). 전체 학생/실기기 전수 시험은 아니다.
- 실제 한영4놀이 모두 버튼 클릭→준비된 게임 화면·복귀 확인. 영어 쓰기 tape의 전체보기 toggle·색칠 mud·그림짝4개도 확인. 정답 제출/원격 학생 성적·운영 데이터 수정은 하지 않았다. 출제/진입·도움 조작 QA와 전체 완주를 구분한다.
- 최종 화면 증거 `C:/project/tangobook/output/adaptive-free-play-20261017/`의 한영 menu·영어 writing. 기존 사용자 탭을 보존했고 작업 탭만 결과로 남겼다.
- 당시 손글씨 OCR 질문은 가능성 설명까지 답했다. 이후 아래 최종 결정으로 OCR/받아쓰기를 제외했으며 더 이상 구현·품질 검증 대기 과제가 아니다.

## 로컬 통합

- 구현/작업 기억 `82ee057a7`를 실제 `C:/project/tangobook` main에 fast-forward·포함 확인. fetch 기준 origin/main은58375b618로 그대로였고 기존 로컬4커밋을 보존했다. 추적 파일 clean, 기존 output/tmp 미추적 산출물 보존.
- 커밋 후 최종 client typecheck도 통과. IAB844×390 실제 viewport에서 한영 블록 도움/타겟/트레이/확인·다음 배치 확인·PNG 저장, viewport 복구. 실제 휴대폰/카메라 실시간 테스트는 아니다.
- 새 main push 요청은 없어 원격 push/운영 배포를 하지 않았다.

## 낱말 쓰기 최종 결정

- 사용자: “손글씨 OCR은 너무 가혹하다. 그냥 낱말 쓰기는 따라쓰는 것만 하도록 하자.” 한글·영어 모두 OCR/받아쓰기 제외로 확정했다. 앞선 가능성 조사·표본 검증 설명은 검토 이력이며 추진 과제가 아니다.
- 실제 코드 확인: adaptive-free-play가 wordWrite의 listen을 first로 제한하고, ConnectedWordLearningActivity는 model/first만 받는다. 기존 따라쓰기와 independent=false 기록이 이미 요구에 부합한다. 엔진·화면·완료 기준 변경은 필요하지 않았다.
- 잘못된 후속 구현을 막도록 소스 주석·플랫폼/전략/모듈 지침·공유 기억을 정리했다. 문서/주석 변경만이므로 diff·링크·공백 검사를 적용하고 기존 UI를 새로 시험했다고 보고하지 않는다.
- 관련 변경은 로컬 커밋하며 이번 요청에는 main push/배포가 포함되지 않는다.

## 메인 푸시 요청

- 사용자가 후속으로 “좋아. 메인에 푸시하자”라고 승인했다. 앞선 새 push 없음은 해당 시점의 기록이다.
- 실제 main=4cae27bd3, fetch 후 origin/main=58375b618, left/right=0/7. 7개는 자유 선반·6종 축소·최종4종 직접 맞춤 시작·OCR 제외 결정 및 관련 검증 기록으로 모두 현재 요청 범위다.
- 추적 변경 없음, 기존 output/tmp 미추적 파일은 그대로 보존한다. 이미 기록된103검사·타입/빌드/화면 검증 뒤 기능 변경은 없고 최종 후속은 문서/주석만이다. 추가 전체 검사를 반복하지 않는다.
- 아래 반영 기록과 함께 일반 push 후 원격 main SHA 일치를 확인한다. Railway 배포 성공·운영 기능 검수는 별도 확인 대상이다.
