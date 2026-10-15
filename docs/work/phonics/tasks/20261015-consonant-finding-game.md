# 배운 자음만으로 같은 자음 모두 찾기

- id: 20261015-consonant-finding-game
- domain: phonics
- status: integrated
- updated: 2026-10-15
- base: 6dd519a60
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 작업 커밋을 로컬 main fast-forward로 통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

각 자음 단원 놀며 익히기에 자음 찾기: 여러 자음 속 목표 자음을 중복 배치하고 모두 찾기. 현재까지 배운 자음만 방해꾼으로 등장, 귀여운 반응·액션. 기존 음절 글자 사냥과 구분한다. 모음/받침 단원에는 자음 찾기를 잘못 넣지 않는다.

## 결정과 진행

사용자 후속 정정: **모음을 배우며 ㅇ도 배운 것으로 처리**하므로 ㄱ 단원부터 ㄱ·ㅇ을 사용한다. 초기 ㄱ 네 개만 제공하던 해석을 대체한다. 이후 현재까지 배운 기본/쌍자음을 추가하며 미래 ㄴ/ㅋ 등은 미리 채우지 않는다. 목표4개·누적 자음 방해꾼8개를 섞는다. 기존 완료 챕터를 새 활동 때문에 잠그지 않도록 새 학습의 guided 단계에만 추가하고 grandfather snapshot을 보존한다. 기존 자음 WebP/소리/공용 효과 활용.

## 검증

- 기본14/쌍자음5 단원마다 목표4개·현재까지의 누적 자음+선행ㅇ만 등장함을 전수 검사했다. ㄱ은 ㄱ4/ㅇ8이며 미래 ㄴ을 넣지 않는다. 모음/받침/복합모음/복습에는 추가하지 않는다.
- 같은 조각 중복 탭·오답 무진도·정답4개·착지650ms→공용 소리/칭찬 종료 후 완료·이탈 취소 회귀 통과. 새 숙달 점수/독립 읽기 성공을 꾸미지 않는다.
- 기존 ToyHangul WebP/배경/탭 효과 재사용. 탄성 등장·오답 흔들림·정답 수집/체크는 CSS transform/opacity, 새 무거운 런타임/이미지 생성 없음.
- 새 guided 단계에 포함하되 기존 완료 챕터는 최초 legacy snapshot으로 면제한다. completedActivities에 가짜 완료를 기록하지 않는다. 새 자녀/미완료 챕터는 실제 게임 필요. 기존 word-learning snapshot 키 유지.
- 실제 PC ㄱ·ㅇ 판과 ㄴ 누적 판, 오답/정답2개 수집·목록 전환을 확인했다. 태블릿1024×768/폰 가로568×320 브라우저 검수, 실제 사용자 완주/물리 기기 실험 아님.
- 최종 관련6파일67검사(전수 풀·플레이어·진도 이행·지도/목록 포함) 통과. 증거 output/persistent-workspace-20261015/consonant-find-final.png, consonant-find-tablet.png, consonant-find-phone-final.png. 최종 PC/폰 증거는 사용자 ㅇ 정정 반영본, 중간 ㄴ 캡처는 정정 전이다.

## 인계

### 목표/놀이판 구분 후속

사용자가 목표 자음과 맞혀야 하는 자음 조각이 같은 대상으로 보인다고 지적했다. 왼쪽은 따뜻한 크림 안내판과 ‘찾을 자음’, 오른쪽은 굵은 민트 가장자리·입체 바닥의 별도 놀이판으로 묶었다. 찾기 안내는 조각들이 모인 판 위에 둔다. 배운 자음 풀/목표4개/소리·완료 동작 유지. PC1280×720·태블릿1024×768·가로568×320에서 판과 조각 잘림을 직접 재확인했다. 소형 판 bounds x167.74/y80.94/368.18×214.13, 조각 최소57.6×48px로 모두 판 안에 들어간다. 증거 output/persistent-workspace-20261015/consonant-find-playmat-pc.png와 consonant-find-playmat-phone.png. 이번 UI 후속의 기존 게임 회귀4개·타입/lint·client build 확인, 원격 미푸시.

로컬 main 통합, 원격 push/배포 미요청. 지도/학습 틀과 함께 전달한다.
