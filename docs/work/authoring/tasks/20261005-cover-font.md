# 탱고북 표지 손글씨체 시험판

- id: 20261005-authoring-cover-font
- domain: authoring
- status: ready
- updated: 2026-10-05
- base: 4a710657
- branch: codex/authoring-cover-font
- worktree: C:/Users/101024/.codex/worktrees/storybook-cover-font/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

사용자는 실제 명작 표지의 A/B/C 비교에서 B 손글씨체를 선호하고, 책별 색 맞춤형을 선택했다. 전래/자연관찰/호리 실제 표지에 같은 조형을 적용한 뒤 "폰트 만들어보자"로 실제 파일 제작을 요청했다.

첫 시험판 범위: 비교한 여섯 표지 제목과 탱고북 이름에 필요한 한글 24자, 영문 대소문자, 숫자, 기본 문장부호. 설치 가능한 TTF와 웹용 WOFF2, 재현 가능한 벡터 원본/빌드, 지원 글자 목록과 누락 표시가 있는 미리보기를 제공한다. 한글 전체 지원·다른 언어·제품 편집기 적용은 이번 시험판 완료 조건이 아니다.

## 읽은 기억과 변경 범위

공통 handoff, authoring BRIEF/MEMORY, 디자인 시스템·루트 및 editor CLAUDE를 확인했다. 기존 UI/Pretendard/NanumSquareRound와 학습용 글자 마스크는 변경하지 않는다. assets/fonts/tangobook-story-hand에 독립 시험판을 둔다.

## 결정과 진행

- 초기 시안/표지 비교 원본은 C:/projects/tangobook/output/cover-type-studies-20261005에 보존되어 있다.
- 색/테두리/그림자는 폰트에 고정하지 않는다. 단색 벡터 윤곽을 사용한다.
- B만 참조해 한글 24자와 영문·숫자 글리프 원본을 만들고 윤곽을 벡터화한다. 다른 서체 윤곽이나 라이선스 폰트를 복사하지 않는다.
- 운영 원본/표지, R2/DB 쓰기 없음. 새 worktree는 fetch 후 origin/main에서 시작했고 기존 로컬 main/영상 브랜치는 보존했다.

## 검증

`build.py`와 `verify.py` 완료. 한글 24자·ASCII 전체와 추가 기호를 포함한 Unicode 128개/129 글리프. TTF 54,844 bytes, WOFF2 19,724 bytes. 설치·웹용 파일과 제목 입력/색/테두리 조절 미리보기를 제공한다.

- TTF/WOFF2 재로딩 후 cmap/윤곽/metrics 동일. 모든 글리프의 bounds와 bearing 검사 통과.
- 같은 원본/빌드를 별도 출력 폴더에서 재실행한 TTF/WOFF2 SHA256이 정확히 일치했다. 전달 ZIP은 C:/projects/tangobook/output/cover-type-studies-20261005/font-trial-0.1/TangoBookStoryHand-Trial-0.1.zip에 보관한다.
- 실제 FreeType 출력의 O/8/B/공 내부 빈 공간 보존과 한·영 7쌍(여섯 책+탱고북) 육안 검수 완료.
- HarfBuzz에서 여섯 책/탱고북의 누락 글리프 0, To 커닝 40 units, 인어공주 NFD/NFC 출력 동일.
- 긴 호리 제목이 검수판의 영문 영역과 겹치던 문제는 실제 텍스트 폭 기준으로 축소하여 해결했다. 한글 기본 advance도 1000→900으로 줄여 과한 자간을 보정했다.
- 실제 TTF를 읽어 HarfBuzz 배치/벡터 윤곽으로 여섯 표지를 재렌더했다. 결과 C:/projects/tangobook/output/cover-type-studies-20261005/font-trial-0.1/actual-font-covers.png. 기존 이미지 글자를 잘라 붙인 결과가 아니다. 전래/호리는 클린 원본이 없으므로 단색 제목 띠는 그대로 시험 배치다.
- 미지원 '가'를 지원한다고 표시하지 않음을 검사했다. 지원 한글 전체 확대는 미완료 범위다.
- HTML 스크립트 구문 검사와 파일/지원 글자 목록 확인. 브라우저 UI 실행·OS 설치 후 개별 디자인 프로그램 출력은 미검증. Pillow의 RAQM 부재로 FreeType 검수판은 GPOS를 적용하지 않으며 커닝은 별도 HarfBuzz로 검증했다.
- 폰트 전용 검증으로 진행했으며 기존 제품 코드 변경이 없으므로 monorepo 전체 typecheck/test/build는 실행하지 않는다. frozen-lockfile 의존성 설치로 훅 실행 경로를 준비했다.

## 다음 행동

사용자에게 v0.1 실제 파일과 표지 출력을 보여 준다. 모양/자간 승인 후 현재 책 제목에서 필요한 한글 범위를 늘리고 문자별 검수를 계속한다. 제품 적용·전체 한글 지원·다른 문자권을 승인 완료로 간주하지 않는다.

## 인계·통합

관련 폰트/재현 원본·빌드·검증·미리보기와 기억을 함께 로컬 커밋한다. main 통합·push/배포 미요청. 기존 사용자 작업/시안/운영 표지는 보존했다.
