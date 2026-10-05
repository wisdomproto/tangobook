# 동화책 저작도구 기억

2026-10-06 [라이브러리 전체 폰트/클린 표지](tasks/20261006-library-cover-titles.md): 사용자 시험판 반증에 따라 전체 현대 한글11172자/등록11언어 글꼴 범위를 확장. 원형+자체 한글 조합 및 출처/OFL를 명시한 다국어 호환 글리프, 실제2415제목 누락/notdef0. 웹93개 shard/라이브러리 clean 이미지 위 언어별 제목 연결,15테스트/typecheck/client build 통과. 로컬 실제11언어 큰/작은 글꼴 화면과 언어 전환 검수. main push/배포 아직 없음. 기존365 글자 없는 표지는 exec680 생성중/검증71개clean필드 등록 완료; 기존850그림/본문/게임 보존. 최신 task/session 실제 상태부터 이어간다.

2026-10-05 표지 폰트 main push 완료: v0.1/v0.2 실제 폰트·원형/재현코드·사용 지침·DB테이블/등록스크립트 a470b44c까지 원격 main에 일반push하고 SHA일치를 확인했다. 운영 R2/DB 등록 완료와 main 통합을 구분해 검증했으며 Railway 배포/편집기 UI 적용 완료로 확대하지 않는다. [기록](tasks/20261005-cover-font.md).

2026-10-05 [표지 기본 폰트/운영 등록](tasks/20261005-cover-font.md): 사용자 지침 기록·DB업로드·mainpush 요청. [공통 표지 규칙](../../cover-fonts.md)을 AGENTS/CLAUDE/editor에 연결, v0.2 지원범위 확인 후 책별 색/테두리 사용. R2 폰트2버전/메타데이터9개 CDN SHA 검증, Supabase cover_font_assets 두행·preferred v0.2·RLS관리자전용 확인(마이그레이션20261005104926). 기존 표지/편집기 UI는 미변경. 승인 mainpush 진행.

2026-10-05 [표지 손글씨체 아시아 확장 v0.2](tasks/20261005-cover-font.md): 사용자 선택은 등록된 아시아 언어 전체(ko/ja/zh/vi/th/ms/id), 영어 포함8언어. 독립 Asian Trial TTF/WOFF2 Unicode299개·정확한 누락 표시 미리보기·두 실제 클린표지×8언어 제작. 베트남어 대소문자 성조/모음 변형, 일본어/중국어/태국어 두 제목 subset이며 전체 문자권 완성 아님. 자체 원형/native 기호, Thai mark/mkmk·모든VI NFC/NFD·TTF/WOFF2·재빌드해시 통과. 네이티브 조형검수/범위 확대/제품 적용 남음, 로컬커밋만.

2026-10-05 [표지 손글씨체 v0.1](tasks/20261005-cover-font.md): B 손글씨체 하나를 대표로 두고 책별 색/테두리를 바꾸는 방향을 사용자와 검토한 뒤 실제 파일 제작 요청. TTF/WOFF2·지원 글자/원본/빌드/검증·입력형 미리보기 로컬 완료(한글24자/Unicode128개, 전체 한글 아님). 실제 폰트 표지6개 출력과 바이너리/커닝 검증 완료. 기본 UI/학습용 서체·제품 코드·운영 표지 미변경, main 통합/push 미요청.

2026-10-05 장면 색칠 main push 완료: 구현·최신원격 병합 da801cf8을 main에 일반 push하고 원격 SHA 일치 확인. editor2 영상/장면 탭 동시 보존,1215권2430장 catalog 포함. 자동배포/운영화면 반영 완료는 별도 미검증.

2026-10-05 사용자 main push 승인: editor2 장면 색칠 탭과 최종1215권2430장 catalog를 최신origin/main과 통합. 기존 영상관리 videoLibrary 및 장면색칠 showSceneColoring을 동시에 유지, TabBar 통합2테스트/장면8테스트/typecheck/build 통과. 운영 책 본문 일괄 쓰기 없음. [기록](../games/tasks/20261005-changjak-11-19-scene-coloring.md).

2026-10-03 [editor2 장면 색칠](tasks/20261003-editor2-scene-coloring.md): 동화책 전용 탭에 책 ID별 최종 도안365권730장 원본/선화와 ColoringPlayer 전체화면 미리보기를 연결. v1/파닉스 보존, 언어별 정확한 쪽 본문/음원·명시sampling 유지. 저장소 catalog 연결이라 운영 책 본문 일괄변경 없음. client 타입/빌드/lint 및8테스트 통과, 실제 editor2 목록표시 확인; 미리보기 이후 브라우저 연결timeout으로 이번 경로 실제붓질은 미확인. 로컬커밋만/운영push 미요청.

2026-10-04 [인어공주 운영 등록](tasks/20261004-little-mermaid-video-registration.md): 승인 KO/EN 롱폼·숏폼 4개를 Editor2 영상 v1과 마케팅 초안에 동일 링크로 등록했다. SRT·MP3·대본·표지 포함, R2 14개 무결성과 정식 원본 연결 및 운영 화면 확인 완료. 재생성 임시 파일 621개/469.5MiB 정리 후 보존 ledger 561개 재검증 통과. 사용자 main push 요청에 따라 최신 원격 변경을 보존해 통합한다.

2026-10-02 [마케팅 책 원본 DB 마이그레이션](../marketing/tasks/20261002-content-sources-db-migration.md)을 사용자 지시로 적용/검증해 아래 신데렐라·백설공주 등록의 DB 제한을 해소했다. 운영 Editor2 등록 버튼 성공 및 기존 기획 재사용, 정식 content_source_id 연결 완료. 영상 v1과 기존 파일은 그대로다.

2026-10-02 [신데렐라·백설공주 실제 영상 등록](tasks/20261002-cinderella-snow-white-video-registration.md): ko/en 롱폼·숏폼 8개 완성본과 SRT·대본·MP3·표지 및 clean 원본 4개를 운영 R2/Editor2 v1에 저장하고 마케팅 기획 2개에 동일 링크로 연결했다. 백설공주는 quality-v2 최신 수정본. 운영 DB에 mkt_content_sources가 없어 기존 storybook memo 연결을 사용했다. 등록 자료는 검증 완료지만 새 등록 버튼/원본 카탈로그는 준비된 2026-09-22 DB 마이그레이션 적용이 필요하다. 상세 ID·해시·검증 경로는 작업 기록 참조.

2026-10-02 후속 사용자 “푸시하자”로 [영상 관리](tasks/20261002-editor2-video-library.md) main push 승인. 최신 origin/main에서 이번 변경만 통합했다(`codex/editor2-video-library-push`, 구현 `1e84bd75`). 기존 로컬 main/영상 제작 이력을 보존하고 원격의 최신 색칠 작업을 유지한다. 아래의 미요청 기록은 이 승인으로 갱신된다.

2026-10-02 [Editor2 영상 자산 관리](tasks/20261002-editor2-video-library.md): 오디오북 탭을 숨기고 동영상 제작을 영상으로 교체. 롱폼/숏폼 공통 원본과 언어별 완성 영상·SRT·나레이션·썸네일을 별도 R2 manifest/버전으로 관리한다. 마케팅 등록은 파일 복사 없이 저장된 완성본 링크를 사용하며 같은 버전 재시도는 멱등이다. 사용자의 후속 요청으로 기존 책 300권 영상 프로젝트, 마케팅 롱폼 383개·인스타 영상 연결 227개, R2 MP4 1,099개와 미발행 예약 5개를 실제 정리하고 나머지 책/인스타 필드 보존을 검증했다. 새 로컬 신데렐라·백설공주 완성본은 보존. 코드 작업은 `codex/editor2-video-library`에서 로컬 완료하며 main push/운영 배포 미요청.

2026-10-01 [자료실 동화 색칠 테스트](tasks/20261001-classic-coloring-library-link.md): 상단 자료실의 색칠 작업판 바로 아래에 “동화 장면 색칠 (테스트)” 외부 링크 추가. 명작144권/전래40권을 같은 시험판 URL의 탭으로 제공. 로컬 main 통합, 운영 push 미요청. 생성/게임 품질 검수는 별도 색칠 작업에서 계속한다.

갱신: 2026-09-21. 초기 분류 기준: main의 e681e945 및 위 문서들. 이 초기화 작업은 기능 동작 재검증이 아니다.

## 현재 상태

[BRIEF](BRIEF.md)에 기존 코드·전문 지침을 연결했다. 이 영역의 진행 작업을 아직 이관·확정하지 않았다. 작업이 없다는 뜻은 아니다. 재개 시 worktree의 task 기록과 변경 내용을 먼저 확인한다.

## 유지할 결정과 이유

2026-10-02 후속: 기존 로컬 FFmpeg 합성을 새 영상 관리에서도 유지한다. 현재 언어의 SRT·MP3를 공통 원본에 브라우저에서 합성하고, 결과 미리보기/다운로드 후 완성 영상으로 적용→저장→마케팅 등록한다. 세부 제한과 실제 합성 증거는 위 영상 관리 작업 기록에 있다.

한 책은 한 그림체·한 레벨이며 책 그룹으로 연결한다. editor2를 기준으로 작업하고 v1 수정은 별도 요청 범위를 확인한다.

2026-09-22부터 editor2의 저작 승인이 마케팅 책 원본 등록 게이트다. 승인 시 `mkt_content_sources`에 원본 메타를 동기화하고, 승인된 책 저장은 원본 메타만 갱신한다. 블로그·쇼츠·채널 발행 정보는 editor2로 가져오거나 저장하지 않는다. 상세는 [마케팅 자동 동기화 작업](../marketing/tasks/20260922-storybook-marketing-source-sync.md).

근거 원본은 [BRIEF의 자료](BRIEF.md)와 [공통 기억](../../handoff/MEMORY.md). 상세 원본을 이 파일에 길게 복제하지 않는다.

## 실패·반증과 검증 범위

마케팅 원본 동기화 변경은 server/client typecheck·production build와 대상 테스트를 통과했다. 운영 Supabase/R2에는 적용하지 않았다. 원본 지침의 과거 수치는 당시 결과이며 지금도 맞는지 요청 범위에서 확인한다.

## 다음 행동

구체적인 요청과 기존 진행 작업을 대조하여 task를 재개하거나 만든다. 전체 기능을 불필요하게 다시 검토하지 않는다.

## 작업·과거 기록

- [작업 목록](tasks/README.md)
- [분야별 과거 메모리 검색](../LEGACY-MEMORY.md) — 파일명 기반 분류이며 본문 검토 여부와 구분한다.

2026-10-01 사용자 push 승인: [동화 장면 색칠 자료실 링크](tasks/20261001-classic-coloring-library-link.md)를 색칠 작업과 함께 원격 main으로 반영. 설명은6개 분류365권730장·검수 중으로 갱신, 같은 시험판 URL 유지. 전체 게임 승인과 운영 데이터 등록은 별도.
