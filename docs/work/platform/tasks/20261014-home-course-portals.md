# 홈 언어 입구·추천 도서 개편

- id: 20261014-home-course-portals
- domain: platform
- status: planned
- updated: 2026-10-14
- base: 59d955d2d
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청

홈 한글/영어 박스 전체를 버튼으로 만든다. 안의 이어하기/새 시작/모드 선택은 제거하고 언어 입구로 연결한다. 단조로운 언어 버튼과 추천 도서3개 구성을 다른 유아 플랫폼 참고로 다시 디자인한다. 언어 안에서 모드를 나누는 기존 결정을 유지한다. 현재 런타임 변경 없음.

## 조사·현재 코드

LearningHomePage가 진행 상태에 따라 활동 직접 링크와 모드 선택을 만든다. home-recommendations는 공개 동화·그림체 중복 정리·일별 카테고리 추천을3권으로 제한한다. 전체 카드 Link로 변경할 때 중첩 링크를 없애고, 추천 확대 시 공개/중복/편집 순서를 보존한다. 기존 테스트의 이어하기 기대는 제품 결정 변경으로 수정해야 한다.

공식 참고: [Lingokids 섹션 안내](https://help.lingokids.com/hc/en-us/articles/9563170182801-What-sections-can-I-find)는 추천·주제·인기·새 활동의 콘텐츠 행과 별도 Lessons 경로를 설명한다. [Khan Kids 학습 화면 안내](https://khankids.zendesk.com/hc/en-us/articles/360014856151-Learning-Topics-Using-Khan-Academy-Kids-in-Educational-Settings)는 큰 시작 행동과 자유 선택 도서관을 설명한다. 로그인 앱 직접 사용이 아니라 공식 설명 조사다.

## 다음 행동

현재 홈 육안 확인 → 언어별 삽화 입구·더 풍부한 표지 행 구성 → 필요한 자산은 기존 것을 먼저 검토하고 생성 모델 정책 적용 → PC/태블릿/폰 실제 화면 및 관련 회귀 검증. 마지막 사용자 커리큘럼 논의 요청을 먼저 다루고 있으며 이 작업은 완료로 보고하지 않는다. 새 push 요청 없음.
