# 마케팅 책 원본 운영 DB 마이그레이션

- id: 20261002-content-sources-db-migration
- domain: marketing
- status: ready
- updated: 2026-10-02
- base: ccd4181d
- branch: codex/editor2-video-library-push
- worktree: C:/projects/tangobook
- integration: 운영 DB 적용·검증 완료, 기록은 로컬 브랜치
- delivery: 제품 코드 변경 없음, 이번 기록 push 미요청

## 요청과 완료 조건

사용자 “db 마이그레이션 니가 해”로 2026-09-22 마케팅 책 원본 마이그레이션 운영 적용을 명시적으로 요청했다. 정식 책 원본 관계, 원본 카탈로그와 Editor2 등록 기능을 검증하고 기존 콘텐츠/영상/발행 이력을 보존한다.

## 읽은 기억과 범위

handoff/marketing 기억, [원본 동기화 작업](20260922-storybook-marketing-source-sync.md), [신데렐라·백설공주 등록](../../authoring/tasks/20261002-cinderella-snow-white-video-registration.md), CLAUDE의 Supabase/마케팅 지침, supabase-postgres-best-practices의 RLS 지침을 기준으로 진행했다.

## 결정과 진행

- 이전에 DB SQL 경로를 찾지 못했지만, 후속 점검에서 컴퓨터에 이미 설정된 Supabase MCP 관리 인증을 확인했다. 만료된 인증을 공식 OAuth 갱신 경로로 갱신하고 동일한 원래 인증 저장소에 보존했다. 자격증명은 작업 문서/로그/저장소에 복사하지 않았다.
- Supabase MCP의 execute_sql로 상태 확인/백업, apply_migration으로 DDL을 적용했다. R2/앱 스케줄러를 시작하지 않았다.
- 입력 SQL은 supabase/migrations/2026-09-22-marketing-content-sources.sql이며 PostgREST schema reload 알림을 추가했다.
- 적용 이름 marketing_content_sources, 운영 마이그레이션 버전 **20261002055352**. apply_migration success=true 및 list_migrations 포함을 확인했다.
- 백업/적용/검증 증거는 D:/tangobook-video/marketing-source-migration-20261002/에 저장했다. contents-backup.json은 적용 전 306개 마케팅 기획 전체의 로컬 백업이다.

## 검증

- 적용 전 원본 테이블/연결 컬럼이 없음을 직접 SQL로 확인했다.
- 적용 후 원본 267개 생성, 기존 storybook memo 기획 268개가 정식 content_source_id로 연결됐고 미연결 0개다.
- 원본 테이블 RLS 활성화 및 authenticated SELECT 권한을 확인했다.
- 기존 기획 306개는 새 연결 컬럼을 제외한 전체 JSON의 MD5가 동일하다. YouTube 4행·Instagram 233행·발행 이력 1,042행도 각각 전체 JSON MD5가 적용 전과 일치한다.
- before.json / after.json / apply-result.json / migrations-after.json에 해당 결과가 있다.
- 두 책 모두 기존 영상 v1/기획 ID로 BookVideoService.register를 재호출해 reused=true, 영상 버전 1개·롱폼 2행·릴스 1행(ko/en) 유지 및 정식 source_id 일치를 확인했다. 원본 메타데이터를 실제 책에서 갱신하고 저작 승인 상태는 R2 승인 기록에 맞춰 unapproved로 유지했다.
- 공개 익명 REST 조회는 HTTP 200/0행으로 접근 차단을 확인했다. 로그인한 운영 마케팅 화면에서는 책 원본 카탈로그가 오류 없이 열린다.
- 실제 운영 백설공주 Editor2의 “마케팅 콘텐츠로 등록”을 눌러 “이미 등록된 영상입니다.” 성공 메시지를 확인했다. 신규 중복 기획 없음.
- 재등록 검증 후 다시 모든 기존 기획/YouTube/Instagram/발행 행의 해시를 비교해 일치했다. preservation-verification.json과 registration-verification.json에 검증 결과를 보관했다.
- SQL 파일/관련 문서 링크 및 git diff --check를 확인했다. 제품 코드 변경이 없어 앱 테스트/빌드는 반복하지 않았다.

## 다음 행동

요청된 운영 마이그레이션과 등록 기능 검증 완료. 기존 승인 책 전체를 R2에서 새로 복구하는 배치는 이번 요청 범위가 아니다. 로컬 SQL/MCP 실행 보조 스크립트는 백업 폴더에 보관하고 제품 코드에는 추가하지 않는다.
