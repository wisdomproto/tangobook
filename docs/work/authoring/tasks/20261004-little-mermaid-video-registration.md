# 인어공주 네 영상 운영 등록·main 통합·임시 파일 정리

- id: 20261004-authoring-little-mermaid-video-registration
- domain: authoring
- status: integrated
- updated: 2026-10-04
- branch: codex/editor2-video-library-push
- delivery: 운영 Editor2/마케팅 등록 완료, 사용자 요청으로 main 일반 push

## 요청과 범위

사용자 “오 굿 좋다. editor2 랑 마케팅 페이지에 올레고 메인에 푸시하자. 쓸데 없는건 지우고”. [인어공주 제작 최종 결과](../../video/tasks/20261003-little-mermaid-four-videos.md)의 승인된 한국어/영어 롱폼·숏폼 네 개를 등록하고 관련 기억을 main에 통합한다. 마케팅 초안 등록이며 외부 채널 발행은 수행하지 않는다.

handoff/작업 지도와 authoring·marketing 기억, 기존 등록/DB 마이그레이션, root/editor/marketing CLAUDE 지침 및 실제 서비스를 확인했다. 제품 코드 변경 없이 BookVideoService를 직접 호출했다. 서버 앱 부팅 없이 DISABLE_PUBLISH_SCHEDULER=1을 설정했다.

## 운영 결과

- 책: 1772181399388, 인어 공주_그림체2(paper-craft).
- Editor2 영상 v1: 5a747bed-ed87-425d-8dcb-d6aad0d63e4f.
- 마케팅 기획: 3696ea56-0b4e-542c-a4b5-c6308ed02164.
- 프로젝트: 41560119-7751-46f0-9015-d24eaf4cc62e.
- 정식 책 원본: a51e64ce-35d7-4f6f-bad2-6ce18512e5e4.
- YouTube 롱폼 ko/en 2행과 Instagram ko/en 릴스 2트랙을 동일 R2 파일 링크로 연결했다. 상태 draft, confirmed=false.
- 새 R2 파일 14개: 최종 MP4 4, 무음·무자막 공통 picture 원본 2, 기존 Voicebox 나레이션 MP3 4, 표지 JPG 4. 네 트랙의 SRT·대본을 함께 보관했다. 새 TTS 생성 없음.
- 공통 원본은 KO 타임라인이다. EN 완성본은 언어별 자체 타임라인이므로 EN 재합성에 로컬 en-long/en-short의 picture.mp4와 음원을 사용한다. 언어별 clean master는 BGM/효과음을 포함하며 공통 무음 원본과 구분한다.
- 책 본문/삽화 객체는 등록 전후 SHA가 동일하다. 기존 신데렐라·백설공주 및 다른 콘텐츠는 보존한다.

## 검증과 증거

승인 최종 SHA256 대조, R2 14개 HEAD 크기/MIME/MD5 ETag 일치, 저장 후 Editor2/마케팅의 네 트랙 URL·SRT·음원·표지와 정식 원본 연결을 다시 읽어 확인했다. 운영 브라우저에서 Editor2의 KO/EN 롱폼/숏폼 파일·음원 표시와 마케팅의 인어공주 v1 목록, 양 언어 롱폼 썸네일/SRT 및 릴스 영상·커버 표시를 확인했다. 릴스 플레이어 KO 39.166667초/EN 34.5초, readyState=4/error 없음. 전체 네 영상을 브라우저에서 다시 전 길이 시청한 검수는 아니다.

운영 재시도 계획/실행 스크립트와 verification.json, 화면 PNG는 D:/tangobook-video/mermaid-registration-20261004/에 보관했다. 서버 scripts의 임시 실행 복사본은 제거했다. 자격증명·서명 URL은 문서/커밋에 포함하지 않는다.

롱폼 플레이어도 KO 162.208333초/EN 149.125초로 로딩되어 네 플레이어 모두 readyState=4/error 없음 확인. ui-verification.json에 결과를 저장했다.

## 정리와 Git

제작 폴더 안의 재생성 가능한 v-*.mp4/캐시 JSON, a-*.wav, 보존 contact sheet에 포함된 개별 QC 프레임, Python 캐시만 명시적으로 정리했다. 삭제 전 절대 경로·크기 및 provenance ledger와 비중복을 확인했다. 621개/469.5MiB 정리, cleanup-plan.json/cleanup-result.json 보관. 최종본·원본 source/참조/Voicebox 음원·프롬프트·검수 sheet·재현 스크립트를 보존했다. 정리 후 validate_delivery.py 재실행: 12개 최종/clean/MP3 전체 decode와 길이·해상도 및 ledger 561개 SHA/크기 전수 통과.

시작 시 origin/main과 현재 브랜치는 6/4로 갈라져 있었다. 정상 merge로 최신 원격 단어/색칠 작업을 유지하고, 공유 메모 충돌은 양쪽 기록을 함께 보존했다(9b40fdac). 원격과 비교한 변경은 기억 문서뿐이다. 문서 링크·diff 및 커밋 훅을 검증하고, push 직전 fetch와 origin/main...HEAD의 뒤처짐 0을 확인해 HEAD:main으로 일반 push한다. force-push, 다른 worktree/미추적 output 정리는 하지 않는다.
