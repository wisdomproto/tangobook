# editor2 책별 장면 색칠 탭

2026-10-03. 사용자 요청: 완성한 장면 색칠을 각 동화책 editor2 탭에 넣고 그 안에서 게임을 미리 실행한다.

## 결과

- `codex/games-classic-scene-coloring`에서 구현. editor2 동화책에 `장면 색칠` 탭을 추가했다. v1 `/editor` 및 파닉스 탭에는 추가하지 않는다.
- 공개된 최종 시험판 manifest를 책 ID로 묶어 저장소 catalog에 가져왔다. 6분류 365권 730장, 권당 2장. 제목이나 그림체로 추측 매칭하지 않는다. 다른 그림체 책/미제작 책에 남의 도안을 표시하지 않는다.
- 각 쪽의 원본/도안을 비교하고 `게임 미리보기`로 같은 `ColoringPlayer`를 실행한다. 원본/선화는 검수된 `?v=SHA` URL을 사용한다. 도안 catalog는 탭을 열 때만 동적 로드한다.
- 편집 중인 책의 정확한 pageNumber로 현재 언어의 본문/음원을 우선 읽고, 해당 쪽 snapshot을 폴백으로 쓴다. 번역이 없으면 한국어로 몰래 대체하지 않고 실행 불가를 표시한다. 음원 미제공은 기존 무음 리빌 흐름으로 동작한다.
- 명시 median만 보존한다. 원본 픽셀 색 추출, 폐곡선/완료 기준은 변경하지 않았다.
- 전체화면 미리보기, 돌아가기/Escape, 키보드 포커스 제한과 복원, 배경 스크롤 차단. 책/탭 변경은 컴포넌트를 언마운트하여 리빌/오디오를 정리하며 붓질 소리도 종료한다.
- 책 R2 본문을 365권 일괄 덮어쓰는 방식이 아니라, 버전 관리하는 책 ID catalog 연결이다. 책의 저장 버튼은 기존 동작 그대로이며, 이 목록은 별도로 저장할 필요가 없다. 추가 도안 갱신은 `node scripts/build-editor-scene-coloring-catalog.mjs`로 공개 manifest에서 재가져온다. 제작 범위/해시/중복을 검증한 후에만 catalog를 쓴다.

## 검증과 한계

- client 최종 typecheck/production build, 변경 파일 ESLint 및 커밋 훅 통과. 데이터 연결/정확한 쪽/다국어/음원 없음/미제작 책/미리보기 열기·돌아가기·Escape 8테스트 통과. 두 번째 build는 장시간 지연했으나 최종 exit0/5분10초 완료를 확인했다. 지연 중 종료를 시도하려던 PID는 이미 자연 종료하여 프로세스를 중단하지 않았다. 기존 서버도 유지했다. 이전 커밋의 build 미완료 기재는 이 완료 확인으로 정정한다.
- 로컬 `http://127.0.0.1:5236/editor2/1773711154702`에서 실제 운영 책을 읽기 전용으로 조회하여 `장면 색칠` 탭과 강아지 11/13쪽 원본·도안 두 장·현재 한국어 본문 표시를 확인했다.
- 미리보기 클릭 이후 in-app Browser의 CDP 연결이 응답하지 않았다. 재연결 및 새 탭도 timeout으로 실제 붓질을 이번 editor2 경로에서 확인하지 못했다. 게임 실행/닫기는 Player를 mock한 UI 테스트이며 실제 붓질 증거로 보고하지 않는다. 기존 최종 시험판의 장별 실제 게임 검수는 별도 저장 증거다.
- 로컬 개발 서버5236은 `DISABLE_PUBLISH_SCHEDULER=1`, 운영 API는 조회만 사용했다. 사용자 시험판 탭75 및 기존 서버들을 중단하지 않았다.
- 로컬 코드/기록 커밋만. 운영 editor2에 반영하려면 main 통합·push가 필요하며 이번 요청을 배포 승인으로 확대하지 않았다. 기존 시험판 URL의 데이터를 변경하지 않았다.

## 관련 파일

2026-10-04 후속: [퐁이네 장면 색칠](../../games/tasks/20261004-pongi-scene-coloring.md) 50권100장의 공개 도안을 catalog에 추가하여 총415권830장이 됐다. 퐁이네01~50 ID/권당2장/버전 URL 연결 테스트5개와 client typecheck 통과. 기존 컴포넌트/운영 책 데이터 변경 없이 catalog로 연결하며 운영 배포는 하지 않았다.

- `packages/client/src/features/games/components/SceneColoringEditorTab.tsx`
- `packages/client/src/features/games/lib/editor-scene-coloring.ts`
- `packages/client/src/features/games/data/scene-coloring-catalog.json`
- `scripts/build-editor-scene-coloring-catalog.mjs`
- [최종 자연 개편 검수](../../games/tasks/20261001-all-collections-scene-coloring.md)
