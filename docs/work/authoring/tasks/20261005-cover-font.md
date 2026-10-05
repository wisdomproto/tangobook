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

### 2026-10-05 후속: 아시아 등록 언어 전체 확장

사용자는 v0.1에 이어 다른 아시아 언어도 요청했고, 선택 질문에 **등록된 아시아 언어 전체**로 답했다. 대상 ko/ja/zh/vi/th/ms/id와 기존 en. `shared/constants`의 등록 언어 11개와 공개 catalog의 실제 제목 번역 en/th/vi/zh를 별도로 확인했다. 공개 API 읽기만 수행했으며 데이터 쓰기 없음.

v0.2는 독립 Asian Trial 가족으로 Unicode 299개를 포함한다. 베트남어 대소문자 모음 변형·성조를 자체 벡터로 추가했고, 중국어 8자·일본어 14자 추가(人은 중국어와 공유)·태국어 기본 글자 12개와 기호 3개를 검수 원형에서 구성했다. 말레이어/인도네시아어는 라틴 윤곽을 공유한다. 모든 문자권 전체 지원 요청으로 확대 해석하지 않으며 일본어/중국어/태국어는 두 제목 샘플만 지원한다.

일본어/중국어/태국어 글리프 원형에 builtin imagegen을 사용했다. 표지 삽화 생성/교체가 아닌 별도 서체 디자인 원본이며 기존 표지 이미지는 SVG에 그대로 삽입했다. 베트남어/태국어 기호는 native vector. 다른 폰트 윤곽 복사 없음. 생성 프롬프트와 원본은 sources에 저장.

TTF/WOFF2 cmap·윤곽·metrics 일치, 모든 베트남어 알파벳의 NFC/NFD 동일 출력, 8개 언어 샘플 누락 글리프 0, 태국어 기호 zero advance/anchor와 위 기호 스택, bounds 검사를 통과했다. 두 실제 표지 × 8개 언어를 HarfBuzz/SVG 윤곽으로 렌더하고 육안 확인했다. 클린 표지에 제목만 배치했으며 단색 배경 띠 없음. 일본어/말레이어/인도네시아어는 디자인용 제목 예시로 명시한다.

별도 폴더 재빌드 SHA256 일치: TTF 2d660124ed5b97eb641362e6e60cba7e0d314997e2405e0bcb5c1e5b1b0b121b, WOFF2 5870f8fc2836bb2f230c4960c3fea4af58b28e095949d0763bff360cfdf054b8. preview의 실제 cmap 지원 목록을 검사하고 JS 구문을 확인했다.

출력/패키지: C:/projects/tangobook/output/cover-type-studies-20261005/font-trial-0.2. 지원 범위 확대·네이티브 글자 검수·제품 편집기 적용은 남음. OS 설치/HTML 브라우저 UI 실행 미검증. 기존 앱 코드 변경 없음, 폰트 검증으로 완료. 로컬 커밋만 수행하며 main 통합/푸시/배포 없음.

사용자에게 v0.1 실제 파일과 표지 출력을 보여 준다. 모양/자간 승인 후 현재 책 제목에서 필요한 한글 범위를 늘리고 문자별 검수를 계속한다. 제품 적용·전체 한글 지원·다른 문자권을 승인 완료로 간주하지 않는다.

## 인계·통합

### 2026-10-05 표지 사용 지침·운영 등록·main push 요청

사용자는 AGENTS.md 등에 표지용 기본 폰트 사용을 기록하고 폰트 DB 업로드 및 main push를 요청했다. docs/cover-fonts.md를 공통 원본으로 만들고 AGENTS/CLAUDE/editor CLAUDE에 연결했다. 새 표지는 v0.2 지원 글자 확인 후 책별 색/테두리를 사용하고, 클린 표지 위에 텍스트를 별도로 배치한다. 미지원 문자는 추가 제작/검수 후 사용한다. 기존 표지 일괄 교체/편집기 UI 구현은 이번 범위가 아니다.

두 버전의 TTF/WOFF2/coverage/verification과 버전 등록 목록 총9개를 R2 fonts/tangobook-story-hand에 immutable 업로드하고 CDN SHA256 전수 일치를 확인했다. 등록 스크립트는 기존 다른 내용과 충돌하면 중단하며 덮어쓰지 않는다. 예전 실행을 재사용하면 같은 바이트는 업로드하지 않는다.

운영 Supabase에 cover_font_assets 마이그레이션 **20261005104926** 적용 성공, v0.1.0/v0.2.0 두 행과 지원 글자128/299·다운로드주소·SHA256·coverage/검증 메타데이터 등록/재조회 완료. v0.2 preferred=true, RLS=true·anon/authenticated SELECT 권한 false 확인. 기존 관리 MCP OAuth 경로를 사용했고 자격증명 복사/출력/커밋 없음. SQL은 새 테이블과 두 자산에만 한정했다.

증거: C:/projects/tangobook/output/cover-type-studies-20261005/font-registration (upload registry/DB 전후/migration/등록/조회 결과). publish 스크립트 node --check 및 git diff --check 통과. 앱 동작 코드 변경이 없어 monorepo 전체 검증을 반복하지 않는다. 사용자 승인된 main 통합/push를 진행한다.

관련 폰트/재현 원본·빌드·검증·미리보기와 기억을 함께 로컬 커밋한다. main 통합·push/배포 미요청. 기존 사용자 작업/시안/운영 표지는 보존했다.
