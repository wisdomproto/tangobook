# 모음 전용 Book 1 · 모음 하나씩 배우기

- id: 20261012-korean-vowel-book1
- domain: phonics
- status: integrated
- updated: 2026-10-12
- base: 230c72835 (학습 이펙트 로컬 통합, 별도 main 문서 변경 보존)
- branch: codex/korean-vowel-book1
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 로컬 main 통합·기존 Rive/KC 작업 보존
- delivery: 미푸시·미배포

## 요청과 결정

한글을 모르는 아이를 위해 모음을 별도 Book 1로 분리한다. ㅏ·ㅑ·ㅓ·ㅕ·ㅗ·ㅛ·ㅜ·ㅠ·ㅡ·ㅣ를 각각 한 단원에서 한 개씩 익힌다. 담당자가 제안한 두 개씩 복습도 사용자가 정정했으므로 묶음 복습은 넣지 않는다.

학습 권 순서는 모음 / 자음과 기본 음절 / 받침 / 쌍자음 / 복잡한 모음. 기존 책·단원 ID, 음원·그림 source, 자녀별 진척을 보존한다. R2 책 재생성·운영 데이터 변경·push는 요청되지 않았다. 권번호 변경만으로 기존 기본글자 무료 범위를 줄이지 않는다.

## 읽은 기억과 범위

PLATFORM·STRATEGY·design-system, handoff, phonics BRIEF/MEMORY, learner/authoring/learning CLAUDE와 기존 이펙트 task. 학습용 권 구성·활동·진척·리포트·번역을 수정하며 기존 저작 원본 ID는 유지한다.

## 진행

기존 kr-h1-u01은 모음10개를 듣기6+4·쓰기10개로 처리한다. 새 단원은 한 글자의 그림을 눌러 소리를 익히고 폰트로 그 모음을 쓴다. 보기 하나인 퀴즈를 정답 평가로 기록하지 않는다. 기존 주소/이력 호환과 음원 캐시를 함께 확인한다.

## 검증

관련 client 22파일155테스트·server SEO/활동2파일26테스트 통과. client/server typecheck·shared build·client build(36.14초) 통과, 변경 TS ESLint0오류/0경고. shared 빌드 산출물을 실제 Node ESM으로 import하여5권/41단원 확인. 기존 lottie eval·큰 chunk·동적/정적 import 경고는 남음.

새 Book 1 각 단원2필수활동·1모음/묶음 복습 없음, 기존 자음·받침·쌍자음·복합모음·복습 ID/활동 의미, 구형완료6/4그룹·쓰기 대응과 형제/게스트 분리, 소리 실제 ended 뒤 완료·실패 시 재시도·정오답 이벤트 없음, 모음모양(ㅏ)과 발음(아) 분리 검증. 기존 인쇄 source32단원·영어39단원도 유지.

localhost5186 실제 앱에서 새 Book1 목록·ㅏ/ㅑ 단일 그림·375×812 폰트 ㅏ 쓰기 및 native 드래그86%/목표99% 확인. 375문서폭/가로넘침 없음. output/learning-effects-20261012의 vowel-book1.png·vowel-single-lesson.png·vowel-ya-mobile.png·vowel-write-mobile.png·vowel-write-stroke-mobile.png로 보존. API_TARGET5199는 미실행이며 DISABLE_PUBLISH_SCHEDULER=1. 브라우저 소리 요청은 API 부재로 실패했고 완료를 만들지 않는 안내를 확인했으므로 실제 청취·음원 운영연결/실기기/99%전체완료를 검증했다고 보고하지 않는다. 기존 음원 연결/완료 체인은 자동 테스트 근거다.

## 다음 행동

구성/활동·진척·번역·소개와 기록은 601e9cb2f, 권별 완료 후속은 e82aafd1f에 보존했다. 별도 로컬 main의 Rive 승인 샘플/KC 문서 작업을 보존해 정상 병합하고 코드/영역·공유 기억을 포함했다. 원격 push 없음. 실제 API가 켜진 환경/태블릿 청취는 후속 확인. 저작 R2 책 재생성·기존 인쇄32단원 전면 개편·승인 소개서 전면 재제작은 수행하지 않았다.

추가 브라우저 검수: 구형 `/library/phonics/korean/kr-h1-u01`은 새 첫 모음으로 이동. Book 2의 첫 자음은 화면 번호1이지만 기존 `kr-h1-u02`, 복습은 `kr-h1-r1~3`을 유지한다. 모바일 단원 dialog의 열 모음 독립 선택/선택 후 닫힘 확인.

권별 리포트 숫자도 단순 방문 대신 필수활동 완료로 통일했다. 구형 듣기6개+쓰기 이력이 Book 1의6/10 완료에 대응하고 방문한 나머지 모음은 완료로 세지 않는 추가 회귀를 포함해 관련2파일4테스트·ESLint 통과. 전체155회귀와 서버26검증 이후 이 후속 집계만 변경했다. 최종 전체5권이 보이는 `vowel-books-overview.png`도 저장했다.

후속 집계 뒤 최종 client typecheck도 통과했다. 로컬 Vite는 기존 작업 폴더의5186을 유지한다.
