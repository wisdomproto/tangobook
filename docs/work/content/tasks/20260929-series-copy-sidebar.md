# 시리즈 복사 버튼 표시·회차 목록 기본 닫힘

- id: 20260929-content-series-copy-sidebar
- domain: content
- status: integrated
- updated: 2026-09-29
- branch: main
- worktree: C:/projects/tangobook
- delivery: 사용자 요청으로 수정 후 main push 진행.

딩딩 02에서 전체 프롬프트 버튼/페이지 번호가 사라진 것처럼 보인다는 스크린샷을 받았다. 팔레트 overlap에 색상 대신 설명 문장이 들어가 CSS --slope 배경이 무효화되고 흰 텍스트가 흰 바탕에 남는 것이 원인이었다.

- 공용 HTML 빌더에서 유효한 6자리 HEX overlap → ink1 → 기본 어두운색 순으로 UI 색 선택. 미술용 팔레트 설명 원본은 유지한다.
- 동일 원인의 딩딩·유키 각각 50권+plan, 총 102개 HTML에서 --slope 선언만 변경. 원고/SCENE 재생성은 하지 않았다.
- 추가 요청으로 창작동화 19개 시리즈의 회차 목록 자동 열기를 제거. 공용 core 템플릿도 수정해 재생성 시 유지한다. 회차 버튼/닫기/배경 클릭 동작은 유지.
- 동시 진행 퐁이 원고 수정 보존. pongi-core.js는 이번 자동 열기 한 줄만 별도 stage하며 다른 미커밋 수정은 포함하지 않는다.

검증: HTML 102개 diff가 --slope 외 동일한지 확인. 19개 core+template JS 구문 검사. 로컬 정적 서버(운영 API 미연결)와 인앱 브라우저 1280px에서 목록 50행 로드 후 기본 닫힘/클릭 열기/닫기, 전체 프롬프트 17,452자 실제 클립보드 복사 확인. 버튼 배경 rgb(28,26,23), 흰 글자/페이지 번호 가독성 확인. 초기 브라우저가 오래된 JS를 캐시해서 새 포트+no-store로 재검증했다. 캡처는 output/copy-button-fix/dingding-fixed.png. 운영 배포 검증과 구분한다.
