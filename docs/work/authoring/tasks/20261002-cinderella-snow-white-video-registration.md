# 신데렐라·백설공주 완성 영상 등록

- id: 20261002-cinderella-snow-white-video-registration
- domain: authoring
- status: completed
- updated: 2026-10-02
- base: 4fcf3bb0
- branch: codex/editor2-video-library-push
- worktree: C:/projects/tangobook
- integration: 운영 데이터 등록 완료, 제품 코드 변경 없음
- delivery: 이번 기록의 push는 미요청

## 요청과 완료 조건

사용자: “만들어 놓은 신데렐라랑 백설공주 등록하자. editor2 랑 마케팅 페이지 둘다”. 각 책의 한국어/영어 롱폼/숏폼 4개씩, 총 8개 완성본을 기존 영상 서비스로 업로드하고 동일 파일을 마케팅 기획에 연결한다. SRT·나레이션 원고/음원·썸네일을 함께 보관한다. 외부 채널 발행 요청은 없다.

## 읽은 기억과 변경 범위

handoff README/MEMORY, authoring/video/marketing BRIEF·MEMORY, Editor2 영상 관리 작업, root 및 editor/marketing CLAUDE 지침을 확인했다. 서비스/스키마 변경 없이 운영 R2/Supabase 자료를 등록한다. 서버 앱을 부팅하지 않고 기존 BookVideoService를 직접 호출하며 DISABLE_PUBLISH_SCHEDULER=1을 설정한다.

## 결정과 진행

- 신데렐라: 책 1772107608499, 신데렐라_그림체2(paper-craft). 최종본 D:/tangobook-video/cinderella-four-20261001/.
- 백설공주: 책 1789350946294, 백설공주_그림체1(style-1778405374347). 해상도 개선과 48초 장면 수정이 포함된 D:/tangobook-video/snow-white-watercolor-20261001/quality-v2/ 최종본을 선택했다.
- 시작 시 두 책의 영상 manifest revision은 모두 0이었다.
- 공통 원본은 각 형식의 한국어 타임라인 picture.mp4(자막/음성 없는 영상)를 보관한다. 영어 완성본은 다른 길이의 자체 타임라인이므로 영어 재합성 시 한국어 원본에 그대로 덮어씌우지 않는다. 영어 clean picture 원본은 각 로컬 en-long/en-short 폴더에 계속 보존한다.
- voice.wav는 배경음/효과음을 제외한 기존 Voicebox 나레이션이다. 동일 타이밍을 유지한 192kbps MP3를 만들어 등록한다. TTS 재생성 없음.
- 롱폼은 기존 YouTube 썸네일, 숏폼은 최종 영상 1초의 9:16 프레임을 표지로 사용한다.
- 새 UUID 파일 키만 사용한다. 재시도 계획과 SHA256/MD5·등록 결과는 D:/tangobook-video/video-registration-20261002/에 보관한다. 자격증명·서명 URL은 기록하지 않는다.

## 검증

완성 MP4의 선정 SHA256을 대조하고, 모든 업로드의 R2 HEAD ContentLength/ContentType/ETag를 로컬 크기/MIME/MD5와 비교한다. 저장된 Editor2 버전과 마케팅 링크·SRT·나레이션·표지가 일치하는지 다시 읽어 검증한다.

2026-10-02 완료 결과:

| 책 | 영상 v1 ID | 마케팅 기획 ID |
| --- | --- | --- |
| 신데렐라 1772107608499 | e4d31e7d-9299-4d26-9313-8aec4e56d902 | e734ba24-baf7-50bd-a164-6368f00e61c4 |
| 백설공주 1789350946294 | 201f43cb-eff2-4922-9a2b-819c9862afc3 | 15a259cc-f6a1-5ea9-aa05-16fba55d34d7 |

- R2 28개: 완성 MP4 8, clean 공통 원본 4, 나레이션 MP3 8, 표지 JPG 8. 모든 파일의 HEAD 크기/MIME/MD5 ETag 일치. 완성 MP4 8개 SHA256은 기존 승인 최종본과 일치.
- 책마다 롱폼/숏폼 × 한국어/영어 총 4트랙의 SRT와 대본을 저장했다.
- 마케팅 프로젝트 41560119-7751-46f0-9015-d24eaf4cc62e에 기획 2개, YouTube 행 4개, Instagram 행 2개(각 ko/en 릴스)를 생성했다. 모두 draft. 각 영상·음원·표지 URL과 SRT가 Editor2 자료와 정확히 일치한다.
- 검증 파일: D:/tangobook-video/video-registration-20261002/verification.json. 진행·해시·UUID 계획: registration-state.json. 숏폼 표지는 1080×1920 네 장을 contact sheet로 육안 확인했다.
- 실제 운영 사이트에 새 영상 탭 배포를 확인했다. 운영 마케팅 세션으로 로그인 후 신데렐라 Editor2 v1의 한국어/영어 파일·SRT·대본, 마케팅 목록의 두 신규 기획 및 롱폼 썸네일/SRT 표시를 확인했다. 최초 익명 접근의 영상 API 401은 로그인 후 해소된다.
- 백설공주 운영 Editor2의 최신 v1, clean 원본/한국어 완성본/표지/MP3 표시도 확인했다. 마케팅 신데렐라 롱폼 video.readyState=4, duration=155초, error 없음으로 실제 로딩을 확인했다. 모든 영상을 전 길이 다시 재생한 검수는 아니다.
- 실행용 운영 스크립트는 D:/tangobook-video/video-registration-20261002/register-finished-videos-20261002.mts에 보관했다. 서버 scripts 폴더에 임시 복사해 실행하는 relative import 구조이며 저장소 제품 코드에는 남기지 않았다. 재시도는 저장된 UUID/해시 계획을 사용한다.

## 운영 DB 호환과 남은 스키마 단계

후속 사용자 지시에 따라 [2026-10-02 DB 마이그레이션](../../marketing/tasks/20261002-content-sources-db-migration.md)을 적용했다. 아래의 테이블 미적용 제한은 해소됐고 두 기획의 정식 원본 연결, 새 등록 서비스 멱등 재시도와 실제 운영 버튼을 검증했다. 다음 문단은 등록 당시의 장애/우회 기록이다.

첫 마케팅 등록 호출에서 `public.mkt_content_sources`가 없다는 PGRST schema cache 오류를 확인했다. 2026-09-22 준비된 마이그레이션은 실제 운영 DB에 미적용이며 현재 환경에는 SQL 연결/management access token이 없다. Supabase 대시보드도 로그인되지 않아 이 작업에서 스키마 변경은 수행하지 않았다.

등록은 기존 마케팅 UI가 지원하는 `memo=storybook:<bookId>` 방식으로 완료했다. 파일/버전 연결과 행 ID는 BookVideoService의 동일 규약을 사용하고 새 행만 멱등 upsert했다. 미래 마이그레이션의 backfill은 이 memo를 정식 content_source_id 관계로 연결할 수 있다. 저작 승인 상태는 변경하지 않았다. **등록된 영상 열람은 정상이나, Editor2의 등록 버튼과 마케팅 책 원본 카탈로그는 해당 마이그레이션 적용 전 계속 원본 테이블 오류가 날 수 있다.** 이번 우회는 운영 등록 스크립트에만 적용했으며 제품 서비스는 수정하지 않았다.

## 다음 행동

요청된 두 책의 등록은 완료했다. 운영 DB SQL 권한이 있는 환경에서 supabase/migrations/2026-09-22-marketing-content-sources.sql을 검토·적용하고 정식 책 원본 연결 및 등록 버튼을 검증한다. 다른 책 전체 원본 복구/외부 발행은 이번 범위가 아니다.
