# 한글·영어 과정 화면 시각 보완

- id: 20261012-course-page-visual-design
- domain: platform
- status: complete
- updated: 2026-10-12
- base: 48e2add33
- branch: codex/platform-ui-v2
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 후속 사용자 요청으로 origin/main push 완료(7faeed9b8); Railway 배포 완료 미확인

## 사용자 피드백과 결정

과정 화면이 밋밋하다는 피드백에 단원 대표 글자·활동 역할별 시각 구분·단원 목록 위계를 제안했고, 사용자는 구현 및 디자인 참고 조사를 요청했다. 한글 살구·영어 민트 공통 색과 학습 순서·완료 판정·권한·음성·쓰기 마스크를 유지한다. 앞 요청의 main push 승인을 새 디자인 작업에 확대하지 않는다.

## 참고와 적용 판단

- [Khan Academy Kids 공식 라이브러리 안내](https://khankids.zendesk.com/hc/en-us/articles/4403657703821-Find-books-and-lessons-in-the-Khan-Kids-Library): 실제 Letters 화면 이미지를 확인했다. 학습 대상이 보이는 활동별 미리보기·섹션 위계를 참고한다.
- [Duolingo 공식 홈 재설계 설명](https://blog.duolingo.com/new-duolingo-home-screen-design/): 단원 개념 안내와 다음 활동이 분명한 구조를 참고한다. 탱고북의 자유 선택·복습·교육 순서는 그대로 두며 잠금/강제 경로를 추가하지 않는다.
- imagegen SKILL.md의 판단 지침을 읽었다. 기존 webp 삽화·SVG 아이콘·커리큘럼 글자로 구현하는 화면이므로 새로운 생성형 bitmap은 필요하지 않다. 기존 그림의 의미와 스타일을 보존한다.

## 구현·검증 계획

단원 상단에 실제 커리큘럼 글자/패턴과 필수 활동 진도, 기존 경로로 이어 할 행동을 표시한다. 카드에는 활동별 실제 학습 대상과 듣기/쓰기/찾기 표식을 사용한다. 단원 단계 제목은 잘리지 않게 위계를 정리한다. 다섯 UI 언어 번역·기존 커리큘럼/진도 회귀·타입/빌드/lint 및 모바일/태블릿/복습 대표 화면을 확인한다. 운영 데이터/TTS 생성·실물/실기기 검증은 포함하지 않는다.


## 구현 결과

- `CourseUnitHero`: 커리큘럼 글자·철자 패턴 타일, 실제 필수 진행, 표시 가능한 첫 미완료 활동 CTA. 완료한 경우 첫 활동으로 다시 연습한다. 선택 활동 완료는 필수 진행에 포함하지 않는다.
- `CourseActivityVisual` / `course-presentation`: 알파벳 대소문자·모음·쓰기 음절·철자 패턴 미리보기와 역할별 Lucide SVG, 기존 webp를 재사용한다. 긴 낱말은 대표 하나로 단순화하고 글자 수에 맞춰 크기를 조절한다.
- 레벨 제목/설명·단원명을 줄바꿈해 읽도록 정리했다. 한글 살구/코랄, 영어 민트 공통 토큰을 사용한다. 기존 활동 순서·필터·경로·Book 1 블록 미제공·권한·쓰기 판정·음성 코드는 보존했다.
- ko/en/vi/zh/th 다섯 UI 언어에 새 문구·활동 역할·진도 변수를 추가했다.

## 검증

- client typecheck, client build, 변경 TS/TSX ESLint, git diff --check 통과. 빌드의 기존 Browserslist·lottie eval·번들 크기/번역 정적+동적 import 경고는 남는다.
- 과정 미리보기/CTA 신규 가드와 기존 한글·영어 커리큘럼/필수 진행/저장/제공 게임 가드: 7파일 52테스트 통과. 첫 신규 테스트의 모음 4+6 가정은 실제 6+4 그룹을 읽고 정정했다. 교육 데이터는 수정하지 않았다.
- 다섯 번역 JSON의 새 키·역할·{{done}}/{{total}} 변수 일치 확인.
- 브라우저 375×812·887×871·1024×768·1280×720: 한글 모음/복습, 영어 Book 1/Book 3/복습 대표 화면 확인. 가로 overflow 0, 카드/대표 글자 잘림 없음, CTA 48px. 모바일 단원 선택 dialog가 초점을 받고 선택 후 닫히며 본문으로 복귀함을 확인했다.
- 화면 검수에서 영어 Book 1의 내부 `initial sounds` 분류명과 복습의 `long-a`가 대표 타일에 노출되던 문제를 수정하고 가드 추가. 복습의 여러 긴 낱말과 표식 겹침은 대표 낱말 하나로 정리했다.
- 스크린샷: root의 비추적 `output/ui-v2-20261012/course-korean-design.jpg`, `course-english-design.jpg`. 로컬 preview 5185에서 확인 가능.
- 실제 게임 실행/오디오 청취·실물 교구·실기기 검증은 이번 시각 변경 범위에 포함하지 않았다. 운영 TTS 생성·콘텐츠 수정·외부 게시 없음.

## 전달

코드·디자인 계약·기록을 31fb42ba4로 로컬 커밋하고 main에 fast-forward 통합했다. root의 기존 비추적 PDF/output/tmp를 보존했다. preview 5185는 갱신된 빌드를 제공한다. 이번 요청의 push/배포 없음.


## 후속 main 푸시 (2026-10-12)

사용자가 이 변경의 main push를 명시적으로 요청했다. C:/project/tangobook의 실제 main과 기존 비추적 파일을 확인하고 origin을 fetch했다. origin/main 대비 0 behind / 2 ahead였으며 과정 UI 31fb42ba4와 통합 기록 7faeed9b8만 추가됐다. 기존 검증 후 코드 변경이 없어 테스트를 반복하지 않았다.

`git push origin main`으로 48e2add33 → 7faeed9b8 전송 성공. `git ls-remote origin refs/heads/main`과 로컬 HEAD가 7faeed9b8e73bb79594fe1658a6eaa702c9f36d0로 일치함을 확인했다. 이 전달 기록도 함께 커밋·전송한다. Railway의 실제 배포 완료는 별도 미확인이다. 기존 PDF/output/tmp와 다른 worktree는 보존했다.
