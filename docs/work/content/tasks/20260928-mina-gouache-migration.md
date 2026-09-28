# 미나 과슈 전환·개별 시트 등록

- id: 20260928-content-mina-gouache-migration
- domain: content
- status: integrated
- updated: 2026-09-28
- branch: main
- worktree: C:/projects/tangobook
- base: 068175e4
- delivery: 승인 가족 기준 전체 프롬프트 전환, 기존 Mina 이미지 삭제, 새 개별 시트 4장 등록. Git push 미요청.

## 사용자 결정

가족 과슈 시안을 승인하고 모든 프롬프트 수정 및 기존 이미지 전체 삭제를 요청했다. 이어 각 캐릭터를 직접 생성해 넣도록 요청했다. 범위는 Mina 시리즈만이며 다른 시리즈 이미지와 본문 텍스트는 보존한다.

## 구현

- 승인 원본은 `docs/art-direction/references/mina/approved-family-gouache.png`. imagegen에 이 파일을 실제 첨부하여 미나·라주·소누·엄마 각 3방향 시트를 생성했다.
- 미나 산호색/크림 바지/오른쪽 금색 발찌, 라주 데님 파랑/모래색 반바지, 소누 노랑/세이지 반바지, 엄마 세이지 긴 옷. 얼굴과 피부·옷에 반복 점무늬를 없앴다.
- 공통 앵커·개체 규격·개별 시트 스타일·설계·7개 무대와 34개 소품 프롬프트를 과슈로 전환. 500컷 중 점 매체 묘사는 색면·명도로 수정했다. 강 수위와 이야기 물건 수·동작을 보존한다.
- 빌더로 Mina core/plan/index와 50권 HTML 생성. 전용 sheet-style 파일은 코드 펜스가 있어야 빌더가 읽는다. 빈 스타일이면 마젠타 배경으로 되돌아가므로 복사 함수 실출력을 검사했다.
- 운영 기존 자산 조사: `mina-plan` 4장 + `mina-01`~`mina-28` 280장 = 284장. 29~50권은 이미지 없음. 50개 책의 본문 삽화 URL은 같은 이미지 280개를 가리켰다. 원문은 유지하고 이미지 링크 삭제 및 scene_description 갱신.
- 운영 처리 전 자산 manifest/책 스냅샷은 커밋하지 않는 `output/mina-migration/`에 저장했다. 각 책은 쓰기 직전 다시 GET하여 현재 필드를 보존한다.

## 검증

- `node packages/client/scripts/build-series-html.mjs mina`: 50권·500컷 생성.
- `node --check packages/client/public/mina-core.js`: 통과.
- Node VM에서 실제 시트 복사 함수 4개와 500컷 합성 프롬프트 확인. 과슈 앵커·개체 규격 포함, 시트 마젠타 배경 없음, 옛 흰 점/먹점/점 간격 지시 없음.
- 변경 전후 500컷의 장소 토큰·주요 가족 등장 토큰·수위 분수 동일.
- 생성 이미지 육안 확인: 가족 옷 색·표정·3방향, 전신 반복 무늬 없음.
- 운영 재조회 검증 완료: 50권/500쪽의 scene_description 일치, 본문 및 그 외 필드 동일(updatedAt 제외), illustrationUrl 0개. 50권 이미지 manifest 모두 비어 있음. mina-plan에는 새 4종만 있으며 내려받은 PNG SHA256이 생성 원본과 일치.
- 재생성 전 HTML과 원고 사이에 기존 본문 차이가 발견돼 생성물의 `<p class="ko">`는 HEAD의 500쪽 원문을 보존했다. 원고 자체는 수정하지 않았다. 추후 무조건 재빌드하면 이 선행 차이가 다시 나타날 수 있으므로 별도 원고 동기화 시 다룬다.
- `git diff --check` 통과. 앱 동작 변경이 없어 전체 서버/클라이언트 테스트는 실행하지 않았다.
