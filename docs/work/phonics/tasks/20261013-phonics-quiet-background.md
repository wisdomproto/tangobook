# 현재 챕터 배경 절제·활동 연결 검토

- id: 20261013-phonics-quiet-background
- domain: phonics
- status: ready
- updated: 2026-10-13
- base: 4de01a3aa (fetch 후 origin/main...HEAD 0/12)
- branch: codex/phonics-quiet-background
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 미푸시·미배포

## 사용자 반증과 적용 범위

사용자는 현재 챕터의 배경이 과하다고 반증했다. 한영 아이 기본 화면에서 전체 마을 래스터를 제거하고 옅은 크림/민트와 하단의 낮은 언덕 두 개만 둔다. 글자·큰 시작 버튼·짧은 활동 순서는 유지하고 부모 학습 정보의 지도 자산은 보존한다. 추가 그림/엔진/상시 애니메이션 없음.

이어 ‘하나 하고 다음 것 하고 연결이 어색하다, 다른 서비스는 어떻게 하는가’를 물었다. 이번에는 공식 안내/코드 근거로 전환 방향을 검토하며 활동 완료/진도/음원 종료 동작은 바꾸지 않는다.

## 공식 사례·현재 코드

- [Khan Academy Kids 학습 경로](https://khankids.zendesk.com/hc/en-us/articles/360048828572-Learn-more-about-the-Learning-Path): 큰 재생 버튼으로 진입하고 활동/책/영상 순서를 수준에 맞춘다. [교육 현장 사용 안내](https://khankids.zendesk.com/hc/en-us/articles/360014856151-Learning-Topics-Using-Khan-Academy-Kids-in-Educational-Settings)는 경로의 주제 자동 순환 및 중단 후 재생 버튼으로 다음 레슨에 복귀를 설명한다. 매 활동의 구체적인 전환 시간·버튼·모션을 실앱 검수한 근거는 아니다.
- [Fast Phonics 공식 지원](https://support.readingeggs.com/support/solutions/articles/247030-what-is-fast-phonics-): 20개 산봉우리 수준, 각 수준 안 20개 넘는 활동과 해독 가능한 책. 모음 한 글자를 하루 분량으로 정해야 한다는 근거는 아니다.
- [ABCmouse 2 보너스 활동](https://support.abcmouse.com/hc/en-ca/articles/34386768274455-Bonus-Activities-on-the-ABCmouse-2-Learning-Path): 경로에서 활동을 선택하고 미선택 활동은 다음 슬롯으로 이동한다. 모든 서비스가 자동으로 한 경로를 강제하는 것은 아니다.
- 실제 코드: `GuidedPhonicsActivity.onNext`는 같은 단원 다음 활동에 직접 이동하고 단원 경계에서 챕터 화면에 복귀한다. `onComplete` 호출 활동은 곧바로 onNext, `onMarked` 호출 활동은 ready 뒤 `ActivityShell`의 다음 버튼을 사용한다. ‘매 활동마다 지도 복귀’가 현재 원인이라고 단정하면 틀린다. 완료 UI/전환 방식이 활동별로 섞여 있다는 점은 확인했다.

## 후속 설계 제안 — 미적용

챕터 시작 → 듣기/쓰기/놀이를 같은 완료 UI·같은 위치의 큰 다음 버튼으로 연결 → 마지막에서만 챕터 완료/다음 글자 잠금 해제 → 다음 챕터 시작 또는 쉬기. 글을 못 읽는 아이에게 다음 활동 그림을 함께 보여준다. 마지막 발음/칭찬 음성이 끝나기 전에 전환하거나 임의 타이머만으로 완료를 기록하지 않는다. 챕터와 하루 학습 세션은 별개이며 한 글자=하루로 잠그지 않는다. 사용자 질문에 대한 제안으로 남기고 이번 배경 교정에 완료 정책 변경을 섞지 않는다.

## 검증

- client 타입 검사, 변경 TSX ESLint, Prettier, git diff --check 통과. 시각적인 저영향 변경으로 새 테스트/전체 활동 재실행은 하지 않았다.
- 실제5186 앱: 한글 현재ㅑ 쓰기 단계/영어Aa·Bb·Cc 화면 및375×812 모바일 확인. 둘 다 가로 넘침 없음, chapter-landscape background-image=none. 현재 글자/버튼/짧은 활동 순서가 먼저 보인다. 진도 기록은 검수 목적으로 변경하지 않았다.
- 증빙: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/tangobook-quiet-chapter-applied.png. 브라우저를 한글 화면으로 복원하고 viewport override를 해제했다.
- 흐름 조사 근거는 공식 지원 문서와 코드 읽기이며 타사 실앱 플레이 검수/탱고북 활동 전부 완료 실험이 아니다. 이번 전환 정책 변경 없음.
