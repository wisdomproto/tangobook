# 동화책 원본 → 마케팅 자동 동기화

## 요청

editor2에서 동화책 콘텐츠가 늘어나면 마케팅 페이지에도 자동으로 나타나게 한다. 동화책 원본과 마케팅 기획·채널 산출물의 정본은 분리한다.

## 결정

- editor2/R2의 동화책이 원본이다.
- 저작 승인 시 Supabase의 `mkt_content_sources`에 책 원본을 멱등 upsert한다.
- 승인된 책을 다시 저장하면 제목·카테고리·표지·언어·원본 갱신 시각만 재동기화한다.
- 승인 해제나 책 삭제는 원본 상태만 `unapproved`/`archived`로 바꾼다. 기존 마케팅 기획과 발행 이력은 삭제하지 않는다.
- `mkt_contents`는 마케팅 기획이며 `content_source_id`로 원본을 선택적으로 참조한다. 광고처럼 책과 무관한 기획도 계속 허용한다.
- 기존 `memo='storybook:<id>'` 행은 마이그레이션에서 원본 행을 만들고 연결한다. `memo`는 레거시 호환용으로 유지한다.

## 구현 범위

- DB 마이그레이션: 원본 테이블, 명시적 관계, 인덱스, RLS, 기존 행 backfill.
- 서버: 승인/승인 해제/승인된 책 저장/삭제 시 동기화.
- 마케팅 UI: `책 원본` 카탈로그, 상태·기획 수 표시, 원본에서 새 마케팅 기획 생성.
- 복구: 기존 등록 스크립트는 누락 복구용으로 유지하고 새 원본 관계를 사용하도록 갱신한다.

## 운영 제한

이 작업에서는 운영 Supabase 마이그레이션 적용, R2 수정, 외부 게시를 실행하지 않는다. 코드와 마이그레이션을 로컬 검증하고 커밋한다.

## 구현 결과

- `2026-09-22-marketing-content-sources.sql`: 원본 테이블·명시적 관계·FK 인덱스·프로젝트/상태 조회 인덱스·owner RLS·`memo` backfill.
- 승인 API: 승인 전 책을 읽어 원본 upsert, 승인 해제 시 `unapproved`.
- editor2 저장/삭제: 승인된 책은 background 재동기화, 삭제는 `archived`. 마케팅 장애가 책 저장을 막지 않으며 승인 최초 등록은 동기 처리한다.
- 마케팅 좌측 목록의 `책 원본`: 검색, `전체/미기획/기획 있음`, 승인 상태, 연결 기획 수, 이름을 지정한 기획 추가.
- `register-books-marketing.ts`: 빈 마케팅 기획 생성기에서 누락 원본 복구용 upsert로 변경.
- 카드뉴스 캐릭터 참조·릴스 스토리보드·릴스/롱폼 자동 연결·공개 블로그 CTA는 `content_source_id`를 우선 읽고 이전 `memo`를 폴백으로 사용한다.
- 한 책에서 여러 마케팅 기획을 만들 수 있다. 책 ID만 받는 기존 영상 배치는 연결된 기획 중 가장 먼저 만든 기획을 선택한다.

## 검증

- `pnpm install --frozen-lockfile` 완료.
- server/client typecheck 통과.
- server 원본 snapshot/upsert 테스트 2개 통과.
- client 콘텐츠 목록/책 원본 카탈로그 테스트 16개 통과.
- 변경 후 server/client typecheck 재통과.
- server/client production build 통과.
- 변경 파일 ESLint error 0, `git diff --check` 통과. 전체 lint는 기존 저장소 경고 약 1,229건 때문에 exit 1이며 `--quiet`(error only)는 통과했다.

## 남은 운영 단계

코드는 로컬 브랜치에만 있다. 배포 시 DB 마이그레이션을 앱보다 먼저 적용하고, 기존 승인 책 중 `memo` 행도 없는 책은 `register-books-marketing.ts --apply`로 한 번 복구한다. 이 세션에서는 운영 DB와 R2를 변경하지 않았다.
