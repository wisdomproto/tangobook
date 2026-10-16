# 홈 바로 놀기 한영 선택

- id: 20261017-home-free-play-languages
- domain: platform
- status: integrated
- updated: 2026-10-17
- base: 527695698
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: eacd859df 로컬 main fast-forward 포함 확인
- delivery: dcd33cb27 원격 main push·Railway cc654dd6 successful/Active·운영 한영 선택/영어4종 실제 시작 확인

## 사용자 결정

바로 놀기 제목 옆에 한글·영어 선택을 두고 선택한 언어로 블록·낱말 쓰기·색칠·숨은그림4종을 즉시 시작한다. 중간 책/모드 선택은 추가하지 않는다. 운영 검수에서 확인된 한글 전용 상태를 이번 승인으로 확장한다.

## 구현 계획

기존 영어 player와 실제 책의 영어 낱말·음원·번역된 숨은그림 대상을 재사용한다. 한글 규칙·기존 진도는 유지하며 영어 번역이 없는 자료를 한글로 대체하지 않는다. 홈 URL의 선택 상태와 게임 URL의 언어를 연결해 홈 복귀/새로고침에도 해당 선택을 유지한다. 쉬운 낱말은 기존 자체 Cambridge Starters 시드 어휘 목록에 있는 영어2~4알파벳 단일 단어, 한 판 최대3개다. 기존 자산의 영어 블록 그림을 재사용하며 무거운 플레이어는 계속 lazy route로만 가져온다.

## 검증

- 최종9파일78검사 통과: 언어별 문제·영어 음원/한국어 음원 폴백 금지·번역 누락/공개·가림 정책·query cache 분리/공개 catalog 재사용·직접 진입/복귀·일반 헤더와 opt-in 홈 목적지·선택 복원·새로고침 URL을 확인한다. client 타입·변경TS/TSX ESLint·build41.31초 통과. 기존 Browserslist/Lottie eval/혼합 import/큰 청크 경고는 유지한다.
- 실제 localhost5187에서 한글4종(모자/마차/바다/블랙홀·망원경·은하)과 영어4종(블록 bed/axe/wind/food, 쓰기 desk/bed, 색칠 bus/ball, 숨은그림 coat/leaf/wind)을 홈 클릭→중간 선택 없이 실제 player→홈 복귀로 검수했다. 실제 영어블록a 배치로 되돌리기/확인 활성화, 영어 색칠 입력, 숨은그림coat 정답0→1/남은3→2를 확인했다. 전체4게임 완주나 실물 입력 검수는 아니다.
- 공통 GameHeader의 홈 아이콘이 `/library`로 나가 영어 선택을 잃는 것을 실제 검수에서 발견해 GameHomeContext를 바로 놀기에만 제공했다. 별도 callback/back·준비/오류/결과와 공통 홈 아이콘 모두 선택 언어로 돌아간다. 다른 게임의 기본 홈은 `/library` 그대로다. 현재 커리큘럼 이어하기 링크는 검수 전후동일, 진도·숙달 새 기록을 만들지 않는다.
- 짧은 글자만 필터링한 초안의 실제 영어 색칠에서 낯선 dopo가 나와 기존 자체 입문 어휘 시드 목록과 교차했다. 이는 외부 공식 최신 단어목록을 새로 검증했다는 뜻이 아니다. 영어 번역이 없는 도안/숨은 대상은 제외하고 이미지·정답 영역을 새로 만들지 않는다.
- 홈1280×720/1024×768/568×320/375×812의 언어 선택/4버튼 배치를 확인했다. 작은3크기 DOM에서 언어44px·카드 라벨 침범0·그림/라벨 겹침0·가로넘침0, 세로폰에서는 스크롤해 선택/4그림을 육안 확인했다. 영어4종 최종PC는 그림 complete/naturalWidth를 확인했고 숨은그림568×320의 장면/영어 대상도 확인했다. 초기 빠른 캡처는 이미지 로딩 전이라 최종 완전 로딩 캡처와 구분하며 모든 게임/실기기 반응형 전수 검수로 확대하지 않는다.
- 기존 BookCover React18 fetchPriority 개발 경고가 남으며 이번 제품 오류로 숨기거나 console0이라고 보고하지 않는다. 화면 증거 `C:/project/tangobook/output/home-free-play-languages-20261017/`: home-en-pc.png, home-en-크기.png3개, layout-audit.json, blocks-en-pc.png/writing-en-pc.png/coloring-en-pc.png/hidden-en-pc.png, blocks/writing/coloring-en-final-pc.png, hidden-en-568.png. 초기 캡처 파일명과 실제크기가 달랐던3장을 실제PC 이름으로 정정했다.
- 기존 스케줄러를 비활성화한 Vite5187·공개 API proxy를 재사용했다. 새 서버·새 이미지 생성/콘텐츠 배치/운영 설정 변경·새 push는 없으며 로컬 코드와 기록만 전달한다.

## 로컬 main 통합

eacd859df 코드·기억을 root main에 fast-forward 통합하고 ancestor·tracked clean을 확인했다. 최종78검사·타입·ESLint·Prettier·빌드41.31초의 결과를 유지한다. 새 작업의 원격 push/배포는 요청되지 않아 수행하지 않았다. 검수 output/tmp와 다른 worktree는 보존한다.

## main 전달 — 2026-10-17

사용자 후속 요청 “좋아. 메인에 푸시하자”로 한영 바로 놀기 변경의 원격 main 전달을 승인받았다. fetch 후 origin/main...HEAD는0/3이며 기존 운영 검수527695698·구현eacd859df·통합 기록8b209a3bb만 앞서 있다. tracked clean·전달 범위를 확인했고 기존 미추적 output/tmp와 다른 worktree는 보존한다. 제품 코드 변경 없이 기존78검사·타입/lint/Prettier/build41.31초·실제 화면 검증을 유지하며 전달 기록만 추가해 일반 push한다. Railway의 새 운영 배포 성공과 운영 한영4종 검수는 push 성공과 별도로 확인한다.

## 운영 배포·한영 선택/영어4종 검수 — 2026-10-17

- 원격 main dcd33cb271d7b9c9d9bcae9f83f375a99de63dd7·fetch0/0 확인. [Railway 배포](https://railway.com/project/b469e171-479c-400a-80bc-8ab4273c25de/service/0019800b-d014-4464-8638-60dcf283677e?environmentId=9d29baf7-1890-453a-956e-94bc329ef98d&id=cc654dd6-a376-4706-ae46-b5071eabc488#details)의 successful·Active와 GitHub commit 링크가 이 SHA임을 직접 확인했다. 재배포/설정 변경은 하지 않았다.
- 운영 홈을 새로고침해 한글 기본 선택을 확인한 뒤 영어→한글→영어를 실제 전환했다. 선택 색·aria-pressed·영어/한글 블록 이름/그림과4개 링크 lang=en/ko가 함께 변경됐다. 홈 두 과정 이어하기는 한글 consonant-write/영어 learn-_ape로 검수 전후 같았다.
- 영어4개를 실제 홈 링크로 눌러 준비 로딩 뒤 중간 책/모드 선택 없이 게임 화면을 확인했다. 블록 bag/알파벳 트레이·3칸, 쓰기 lamp/4글자, 색칠 Head/실제 도안·물감, 숨은그림 coat·leaf·wind/실제 장면·3대상이 표시됐다. 브라우저1280×720 육안 검수이며 이번에 실기기/모든 반응형/전 문제 완주까지 검사한 것은 아니다.
- 실제 블록b 배치→되돌리기/초기화/확인 활성화, Head 도안 물감1클릭 표시, 숨은그림coat 정답0→1/남은3→2를 확인했다. 쓰기는 진입/표시 확인으로 전체 쓰기 완료나 음성 청취 검수로 확대하지 않는다.
- 블록·쓰기 홈 아이콘, 색칠 돌아가기, 숨은그림 뒤로가기로 모두 `/library?playLang=en`에 복귀·영어 선택 유지 확인. 홈 새로고침 뒤에도 영어 선택·4링크 유지. 한글 왕복 전환도 정상이다. 수집된 운영 탭 console error0, health status ok(2026-10-16T15:38:53.329Z).
- 증거 `C:/project/tangobook/output/production-home-play-languages-20261017/`: home-ko.png, home-en.png, blocks-en.png, writing-en.png, coloring-en.png, hidden-en-found.png, railway.png. 임의 진도/성적 주입·콘텐츠 수정·새 서버/새 push 없이 검수 기록만 로컬 커밋한다. 앞선 운영 미확인/한글 전용 기록은 이전 버전 상태다.
