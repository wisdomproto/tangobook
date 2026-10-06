# 자료실 명작동화 장면 색칠 테스트 링크

- id: 20261001-authoring-classic-coloring-library-link
- domain: authoring
- status: complete
- updated: 2026-10-01
- branch: codex/authoring-classic-coloring-library
- worktree: C:/projects/tangobook/.worktrees/classic-coloring-library
- integration: 로컬 main 통합, 운영 push 미요청

사용자가 서버에 공개한 색칠 테스트 파일을 저작도구 상단 자료실에도 넣도록 요청했다. TopBar 자료실의 기존 색칠 도안 작업판 바로 다음에 “명작동화 장면 색칠 (테스트)”를 추가한다. URL은 https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/index.html 이며 기존 외부 자료 링크처럼 새 탭으로 연다. 설명은144권/288장·원본 비교·색칠 체험·검수 중을 명시한다. 낱말 도안 작업판과 구별한다.

링크 대상은 별도 R2 시험판이다. 실제 서버 브라우저 목록과 개구리왕자p3 붓질/원본 리빌 확인은 기존 색칠 작업에서 수행됐다. 전체288장 게임 품질 승인은 아직 아니며16장 우선 검수는 기존 작업에서 계속한다. 자료실 링크 추가는 운영 책 등록이나 main push 요청으로 확대하지 않는다.

전래동화 탭 추가 요청에 맞춰 메뉴 이름을 “동화 장면 색칠 (테스트)”로 갱신했다. 명작144권·전래40권 원본 비교/색칠 체험을 설명한다. 같은 URL이며 전래80도안은 별도 배치로 순차 추가된다. 메뉴는 기존 ResourceMenu의 외부 a/새 탭 흐름을 재사용한다. pnpm install --frozen-lockfile, 대상 eslint/prettier, diff 검사 통과. 첫 링크 커밋 f5f2c50e는 로컬 main의1231b22c로 통합했다. 운영 push/배포는 하지 않았다.

2026-10-01 같은 채팅의 사용자 push 승인으로 색칠 기능과 자료실 링크를 원격 main에 반영한다. 실제6탭365권730장에 맞춰 자료실 설명을 갱신하고 검수 중을 표시한다. 기존 공개 tests URL과 새 탭 동작을 유지한다. 현재 관련23커밋과 자료실2커밋만의 통합이며 운영 책·게임 등록은 하지 않는다.

푸시 전 최종 검증: TopBar prettier/eslint, 클라이언트 typecheck/build 및 색칠·장면 관련29테스트 통과. 자료실 링크의 href/새 탭 동작은 유지하고 설명만 현재6개 분류/365권730장·검수 중으로 갱신했다.

원격 main push 완료: 02f97e63, ls-remote로 확인. 이전 로컬 main에만 통합/운영 push 미요청 표시는 이 사용자의 새 승인과 반영으로 대체한다. 자동 배포 완료 확인은 별도다.
