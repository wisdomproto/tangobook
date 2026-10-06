# 창작동화 2~10 장면 색칠

- 사용자 요청: 1번과 같은 image 스킬로 2~10번 전권 제작, HTML 시리즈 탭 추가, editor2 책별 연결 유지.
- 시작: `34e7c0ef`, `codex/games-classic-scene-coloring`. 9시리즈 각50권·두 장면, 총450권900장. 기존415권830장 보존, 최종865권1730장.
- imagegen built-in reference edit를 장면별로 실행한다. 원본의 구도/인물수/핵심 행동을 유지하고 굵은 검은 폐곡선/흰 면을 만든다. CLI/Comfy 대체 실행은 하지 않는다.
- 원본 목록과 본문은 운영 API 읽기 전용 조회, API·운영 책 데이터 변경 없음. 원본 부재/다른 시리즈의 comic-assets는 구분하며 확인 없이 다른 캐릭터를 적용하지 않는다.
- 전수 흑백/SHA/원본선화sharedfilled 비교, 시리즈별 대표 실제게임 검수. 작은 흰면/사소한 색 차이/장별 reset 반복으로 지연하지 않고 큰면 색칠불가·인물/행동 변경만 수정한다.
- 공개는 기존 승인된 `tests/classic-scene-coloring/20261001-review-1`만, 시리즈별 검증 완료 후 같은 sync로 순차 반영한다. 원본pixels 추출/엔진/median 변경 없음. 추가main push/운영 배포 미요청.
- 데이터: `D:/ComfyUI-output/classic-scene-coloring/changjak-2-10/production-plan.json` 및 각 `changjak-{series}` 디렉터리. 최종 선화/프롬프트/검수 증거는 workspace에 보존한다.

## 진행

### 전450권900장 제작·게시 및 editor2 연결 완료 (최신)

창작동화2~10 각50권100장, 총450권900장 builtin imagegen 제작과 현재 SHA에 묶인 전수 source/lineart/shared-engine-filled 비교 완료. 마지막 메이42p10/쌍둥이10p3/노노02p4는 내부 얼굴 폐곡선으로 큰면 미색칠을 수정했고 실제 비교에서 정상색칠을 확인했다. 원본 없는25장은 기존 작품 캐릭터·해당쪽 본문을 따른 신규 색 원본으로 명시했으며 원래 제공된 삽화로 보고하지 않는다.

2026-10-04 06:51:53 UTC 승인된tests 경로에 신규900장 게시 완료. 기존830장을 유지하여 총865권1730장, HTML16탭(기존7+신규9)이 됐다. 공개 룰루탭50권100장 표시와 실제 게임 링크를 확인했고, 공개 메이42p10 실제5물감/4CUA쓸기 및 정확한10쪽 버전 원본리빌도 추가 확인했다. 다른900장 공개 실제게임으로 확대하지 않는다.

대표로컬 실제게임은9시리즈 각1장(아래 목록), 전수900은 정적 원본/선화/sharedfilled 비교·mono·SHA 증거이다. native 발화전사/자연ended 전수 검증이나 장별reset 반복을 주장하지 않는다. 대표 evidence와900개 visual-review는 workspace `generated-images/changjak-2-10/changjak-*/evidence`에 보존했다. 실제공개게임 evidence는 `public-game-smoke.json`이다.

게시된manifest에서 editor2 catalog를 다시 구성해865권1730장 버전URL로 책별 연결했다. 연결/미리보기 테스트2파일8개 재통과, pnpm typecheck 및6스크립트 구문 검사 통과. 운영 책 데이터 변경·main push·운영 editor2 배포는 하지 않았다. 게시된 새900장 원본/도안1800개 실제플레이 버전URL 다운로드SHA 전부일치, 기존830장 source/line SHA 보존 및865권1730장 범위 검증 통과. 최종증거는 workspace `generated-images/changjak-2-10/published-asset-verification.json`이다. 검수용 임시탭은 닫고 사용자gallery는 보존한다.

### 900장 생성 및 실제 대표게임 확인 (최신)

9시리즈 각50권/100장, 총450권900장 builtin imagegen 생성 완료. 원본 없는25장은 새 색 원본으로 명시하고 실제 확인 뒤 선화를 만들었다. 현재900장 흑백/SHA/sharedenginefilled 정적 비교 완료, 큰면 실패7장만 정확한 위치를 지정한 추가 수정 진행 중이다. 미승인 결과를 완료로 기록하거나 게시하지 않는다.

대표실제게임9: 코코02p8, 메이36p8, 도도04p3, 브루노13p6, 쌍둥이26p10, 미오27p8, 피포32p3, 노노05p7, 룰루28p9. 실제 CUA 붓질/큰몸색/정확한 해당쪽 source URL 리빌을 확인했다. 전900장 개별브라우저 검증이나 native 발화전사는 아니다. source/lineart/sharedfilled 육안대조와 대표게임 증거를 구분하며 reset 반복은 하지 않는다. 룰루 완료fallback status를 확인했고 다른 즉시리빌 증거는 읽기완료로 확대하지 않았다.

16개 시리즈/분류 HTML 탭 추가 및 editor2 catalog 865권1730장 연결 구현. 두 파일 테스트8개와 pnpm typecheck 통과. 아직 신규900장 전체 공개 전이며 마지막7장 확인/동일 승인tests sync/1800 버전이미지 실제다운로드 SHA/게시본 catalog 재빌드가 남았다. 기존830장 보존용 공개manifest 스냅샷을 저장했다. imagegen CLI/Comfy 대체나 runtime 색·median·영역기준 변경 없음.

실제 목록에서 코코/메이/도도/브루노/쌍둥이/미오/피포/노노/룰루 각50권을 확인했다. 본문 주요 행동이 드러나는 전반·후반 두 장면씩 원본 선정/다운로드 중이다. 아직 신규 공개0이며 완료로 보고하지 않는다.

### 전권 선정 및 첫 생성

900장 선정 완료. 코코98개 기존 원본/메이100개/도도97개 실제 source contact 검수 후 builtin 생성 요청. 원본 없는 코코48은 실제 캐릭터와 본문으로 새 색 원본2장 생성·육안 확인 후 선화 생성. 도도49p3은 같은 전반 원본이 있는 p1, 노노13p5는 p1로 변경해 원본 부재를 먼저 해결했다. 모든 운영 API는 읽기 전용이다.

코코 첫20장 sharedengine audit/4 comparison 시트 실제 대조,18장 정적 정상·1권 두 장면 큰면 후속 수정 요청. 생성중 요청은 `generated-images/changjak-2-10/executions.json`에 cell와 정확한 key 보존하며 중복 생성하지 않는다. import는 collection별 잠금과 atomic manifest 저장으로 동시 완료를 보존한다. 아직 새 시리즈 게임 승인/공개0이며 생성만 완료로 확대하지 않는다.

### 9시리즈 생성·보완 및 초기 실제게임

기존 원본877장 전체 source contact 실제 대조를 끝내고 9시리즈900장 builtin 요청을 진행한다. 원본없는25(코코2+추가23)는 기존 캐릭터 참조와 쪽 본문/sceneDescription으로 NEW FULL COLOR source를 만들고, 실제 색 원본을 확인한 뒤 별도선화 편집한다. 새그림을 기존원본으로 보고하지 않는다. 추가23 source는 SHA/파일 존재를 확인했고 세 import 대기결과만 정상 생성파일로 복구했다(재생성 없음). 추가20 선화 cell210; 미오 두 장의 라쿤 앞치마와 룰루28p9 사촌 수는 NEW source 정밀편집 cell213 뒤 육안확인/선화 예정.

실행 기록: 기존133/141/147/157/160/162/164/167/169 생성 계속; 175 NEW source23 완료; 187 메이 첫검수 큰면3수정 완료; 201 코코01p2 topcap,221 코코25p9/48p10 cap 수정 진행. 모든 요청은 완료전 중복제출하지 않는다. 셀은 functions.wait로만 재조회한다. 생성수/검수수/공개수를 분리하며 아직 신규 시리즈 공개0이다.

코코 첫55+48두장 comparison 실제 검수,큰잘린얼굴/앞치마 열린면만 held. 작은 흰 얼굴/손/사소한색은 사용자 빠른검수 기준으로 허용한다. 메이 첫34 sharedfilled 실제 비교(17p4까지),31정상·2p6큰꼬리/13p4·13p10큰몸3수정. 비교030 마지막17p10·18p4의 당시 filled없는행은 검수로 세지 않았다. visual-review.json은 key별 dict로 저장한다.

코코5238 실제 ColoringPlayer 02p8 대표 붓질(6물감 자동전환 포함) 전체완료/정확한8쪽 원본리빌/완료fallback 확인. 친근한 눈과 큰몸/반죽·소품 정상. local-game-evidence.json/nativeSpeechVerified=false: 이번 native speech 없음/한국어 발화 전사 아님; BGM playing0.16 뒤 cleanup error4/정지 이벤트를 그대로 보존한다. 장별 reset 반복 없음. 사용자gallery tab2 보존/검수tab3 현재 열림. 검수server5238 exec56196 및 기존5237 보존/운영서버 영향 없음.

sharedengine audit에 --missing 캐시를 추가하여 source/line SHA 동일한 이미 비교결과는 반복하지 않고 새생성/수정만 다시 렌더한다. runtime 영역/원본색/median 변경은 없다. 대표게임 통과만 전100승인으로 확대하지 않으며 전100 visual 승인 후 시리즈별 finalize/config/HTML/editor catalog/sync 게이트를 수행한다.
