# 알파벳 쓰기 잉크·완성 글자·낱말 보상 정리

- id: 20261016-alphabet-writing-finish
- domain: phonics
- status: integrated
- updated: 2026-10-16
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: a4d93fcfb 로컬 main fast-forward 통합, 새 push/배포 없음

## 사용자 반증과 확인

운영 d/q 직접 시험 뒤 칠해진 모양이 지저분하며 마지막 획 즉시 그림으로 바뀌고 d/desk 음성이 안 들린다고 보고했다. 모의 판정 통과가 시각·청각 학습 경험의 완성을 뜻하지 않았음.

실제 코드: 진행선18px/완료 flash22px가 글자 mask 밖 SVG에 그려짐. 획 소유권4px 격자로 중간 경계가 계단 형태. AlphabetLetterWriteActivity는 onResult에서 즉시 canvas 제거·그림 교체. 보상 playAudio는 direct URL만/오류 UI 없음·대소문자 독립 타이머가 서로 소리를 끊을 수 있음. 운영 desk 녹음 URL HEAD200/24523바이트이므로 음원 파일 부재라고 단정하지 않음.

## 변경 방향

폰트·현재 획 mask 안에서만 매끈한 진행 잉크/짧은 빛. 완성 글자 관찰 시간 후 그림/낱말과 명시적 다시 듣기. 대소문자 연속 완료 시 보상 순차 큐·음성 ended 이후 다음 글자, 실패는 재생 버튼으로 재시도. 획 판정/한글 진도/운영 콘텐츠 변경 없음.

## 구현·검수 결과

- 공용 StrokeTraceCanvas의 진행 잉크/완료 sheen을 실제 폰트 alpha·획별 mask로 제한한다. mask는 초기화 때만 만들고 pointer move에서 픽셀을 읽지 않는다. 4px 격자 소유권을 잉크 픽셀 단위로 바꾸고, 실제 폰트 단면에서 구한 직선 획 영역으로 D/d/p/q 등의 연결부가 삼각형으로 패이지 않도록 한다. 판정 경로/허용치/순서는 바꾸지 않았다.
- AlphabetLetterWriteActivity는 완료한 canvas를 유지한 채1.4초 보여준다. 그 뒤 같은 칸 안의 그림+알파벳+낱말로 전환한다. 레이아웃 공간은 canvas가 계속 유지하므로 전환 때 패널 높이가 바뀌지 않는다.
- 대/소문자를 연달아 끝내도 보상을 큐로 재생한다. 저작/flashcard 음원 보완·현재2음원 워밍, URL이 없는 경우 공용 resolver. 실제 audio ended+그림1초 이후에만 다음 보상/다음 글자로 간다. 오류는 넘어가지 않고44px 다시 듣기 버튼을 제공한다. 중복 완료 콜백은 ref로 차단한다.
- 실제 localhost5187 D 세로획 입력으로 반듯한 경계 확인. 임시 DEV fixture(실제 I 단원 데이터를 I만으로 좁힘, 진도 callback 없음)에서 native I 선/i 몸통+점 → 깨끗한 완료 글자 유지 → igloo/iguana 그림 → 두 음성 ended 뒤 완료 callback 확인. 가로844×390에서 그림/낱말이 같은 칸 안에 들어옴. fixture의 단원/진도 조건은 실제 운영 D 완주 증거와 다르다.
- 운영 desk 원본 녹음은 HTTP200·24523바이트. 임시 audio controls 페이지에서 native 재생 후 duration2.988345초/currentTime동일/ended true·error 없음 확인. 소리의 언어적 내용에 대한 청취 승인/운영 D 전과정 완료로 확대하지 않는다.
- 57파일507회귀 통과. 그 뒤 추가한 mask 제한/반듯한 세로획2건 포함 관련2파일26검사 재통과. 변경 TS eslint·typecheck 통과. 최종 build 결과는 아래 인계에서 기록한다.
- 증거: worktree output/alphabet-finish-20261016/{clean-d-stem.png,completed-letter.png,completed-lowercase.png,phone-reward.png}. 임시 검수 HTML/TSX는 output으로 옮기고 제품/커밋에서는 제외했다. 운영 진도/콘텐츠 수정·새 push/배포 없음.

최종 client typecheck·build(29.18초) 성공. 기존 Browserslist/i18n 청크/lottie eval 경고는 빌드 실패가 아니며 이번 범위 밖이다.
