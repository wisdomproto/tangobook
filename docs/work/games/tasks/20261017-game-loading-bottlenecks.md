# 영어 블록·공용 게임 로딩 병목 점검

- id: 20261017-game-loading-bottlenecks
- domain: games
- status: integrated
- base: 443136b33
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: db8aaf7f0 main push 및 운영 배포 success 확인(2026-10-17T14:36:57Z), 검수 기록만 후속 로컬 커밋
- integration: dfc1c1563 로컬 main fast-forward 통합

## 요청·계약

영어 블록과 다른 게임의 로딩을 측정하고 확인된 병목만 줄인다. HTTP/SW 캐시·실제 미디어 준비 확인·기존 게이트/상한/실패 탈출·학습 순서/기록을 유지한다. 영구 warmed 플래그로 게이트를 생략하지 않는다.

## 조사 진행

- 기존 작업 worktree의 tracked clean 확인 후 main443136b33으로 fast-forward했다. 다른 output/tmp는 보존한다.
- 배포 빌드 preview5194·격리 Chrome1280×720에서 영어 블록/한영 쓰기/그림짝/홈4놀이를 cold entry와 같은 context 재진입으로 나누어 계측한다. 캐시 비활성화·사용자 프로필/학습 기록 주입 없음.
- 최초 조사 스크립트에 존재하지 않는 game-english-word-writing 경로를 사용해 timeout. 실제 plan의 game-word-writing 경로로 고쳤다. 이 실패는 제품 로딩 결과에 합산하지 않는다.
- 영어 블록의 첫 진입은 공용 core가 끝난 다음 player가 phonics-library를 요청해 별도 overlay를 기다리는 직렬 구조를 확인했다. 지도/홈 코드와 실제 준비 화면을 추가 비교 중이다.
- 증거는 C:/project/tangobook/output/english-games-loading-20261017/에 보관한다. 실제 태블릿/스피커 청취 검증과 구분한다.

## 수정

- `useGameAssetPreload`에서 영어 블록·영어 그림짝의 phonics-library 조회를 core 그림/정답 음원과 동시에 시작한다. 영어 블록은 알파벳 소리, 그림짝은 단어 fallback 때문에 player에서 실제로 맵을 사용하고 있었다. 기존 shared in-flight/신선도/실패 재시도/HTTP 캐시를 재사용한다.
- core 준비를 건너뛰거나 map 준비를 완료로 가정하지 않는다. 맵이 더 느리면 기존 player overlay가 계속 막는다. 한글/쓰기 등에는 새 영어 목록 조회를 추가하지 않는다. 6초 core·4초 media 상한/250ms 표시/skip·배경 장면은 그대로다.
- `ColoringPlayer`의 완성 원본 `<img>`에도 기존 canvas 색 추출용 이미지와 같은 `crossOrigin=anonymous`를 지정했다. 동일 URL의 no-cors/cors 모드 차이로 별도 요청하던 것을 하나로 합친다. 픽셀 처리·팔레트·붓/판정은 바꾸지 않았다.

## 계측

운영 API를 읽는 로컬 production build preview5194, 격리 Chrome1280×720, 동일 URL·고정 난수/같은 실제 낱말과 삽화, 종류별 새 context3개×최초/재진입 각1회. 캐시는 켠 상태이며 기존 사용자 데이터는 건드리지 않았다. 초기 탐색은 한영 쓰기·홈4종/그림짝도 포함한다.

| 화면 | 수정 전 최초3회(ms) | 수정 후 최초3회(ms) | 중앙값 |
| --- | --- | --- | --- |
| 영어 Book3 블록 | 3545 / 2736 / 2607 | 2711 / 2157 / 2223 | 2736→2223, 약19% |
| 영어 바로 색칠, 개구리왕자 ball | 2265 / 2090 / 2315 | 1687 / 1607 / 2664 | 2265→1687, 약26% |

- 영어 목록 요청은 기존 player가 뜬 뒤 2052~2988ms에 시작하던 것이 879~954ms로 앞당겨졌다. 실제 늦은 목록 요청을 제거한 결과다. 영어 그림짝도 기존2126/2310ms 시작이 새919~1040ms로 앞당겨지고 기존 overlay 뒤 실제 카드 선택까지 확인했다. 첫 조사 그림짝 시간은 카드 DOM만 기다려 overlay가 남을 수 있으므로 전후 속도 수치로 사용하지 않는다.
- 색칠은 모든 표본에서 같은 원본 URL2요청→1요청, 도안 포함 전체 proxy3→2. 재진입에서도 중복 원본 재요청이 없어졌다. Playwright responseBodySize에 SW/전송환경의 음수가 나와 바이트 절감량은 산정하지 않았다. 그림 본문을 새로 생성/변환하지 않는다.
- 재진입 중앙값은 영어 블록1081→1501ms·색칠1260→1479ms로 표본 편차가 남았다. 이번 수치로 재진입 속도 개선을 주장하지 않는다. 원격 책 조회/로컬 디코드·환경 영향을 포함하며 사용자 실기기/운영 배포 속도 보장이 아니다.
- 캐시 자체는 유지: 영어 재진입 각 판 정답 mp3 4개 모두 CDP disk cache, 정적/이미지 포함23응답에 disk/SW 재사용 표시. 색칠 재진입 도안+원본2응답은0~3ms 완료. SW/정적 cache-control 파일 변경 없음. 새 `Audio` 준비는 실제 상태 확인이며 바이트 재다운로드와 구분한다.

## 검증

- 관련7파일56검사 통과 뒤 영어 그림짝 조기 준비까지 추가했다. 최종 변경 hook·수집기·VocabularyStudyContent3파일41검사 통과(앞선 수와 중복 합산하지 않음). 기존 media 동시 공유/재진입 실제 준비/실패 재시도/4초·6초 cap/core 대기·장면 후순위, 영어 블록 및 홈4놀이/팔레트·힌트 회귀를 포함한다.
- client typecheck·변경 source ESLint·build41.14초 성공. 기존 Browserslist/lottie eval/혼합i18n import/large chunk 경고는 남는다.
- 새 built preview1024×768 실제 입력: core progress 동안 알파벳 tray없음→음원 듣기→a배치/되돌리기 성공. 한영 쓰기 짧은 획의 잉크 유지, 한영 색칠 붓 입력/팔레트/원본 anonymous 확인. 한영 숨은그림 장면/2~3타깃 표시 및 오답 위치 tap, 영어 그림짝4카드 중 선택 강조. pageerror0. 전체 게임 완주/실기기 손가락·스피커 청취는 아니다.
- 초기 입력 검수 스크립트가 gray guide의 G/B값을 너무 낮게 잡아 글자 픽셀을 못 찾았다. 가이드 실제색#e5e7eb에 맞춰 탐색 범위를 고친 후 실제 pointer 입력을 확인했다. 제품의 쓰기 오류가 아니며 실패를 성공 기록에 합치지 않았다.
- 화면 증거 gate.png, english-block-input.png, en/ko-writing-input.png, en/ko-coloring-input.png, matching-input.png를 육안 확인했다. 기존 레이아웃/동화 장면·학습 기록 변경 없음.
- 최종 넓은 조사12경로×2진입=24회 모두 준비 화면 도달·pageerror0(`after.json`). 한영 블록/쓰기/색칠/숨은그림 홈4종과 파닉스 영어 블록·한영 쓰기·영어 그림짝을 포함한다. 이 조사는 무작위 내용이어서 개선율 전후 비교에 쓰지 않는다.

## 남은 범위

원격 목록/책 응답의 변동과 색칠 도안의 최초 다운로드·영역 분석 시간이 남는다. 콘텐츠 적합성 검사/필수 이미지 디코드를 제거하거나 전체 캐시 정책을 바꿔 숫자만 줄이지 않는다. 새 이미지/운영 R2·DB 변경 및 push/배포는 이번 범위에 없다.

## 로컬 통합

구현·검수·기록 dfc1c1563을 root main에 fast-forward했다. source3파일의 커밋 훅 실행 후 변경 없음/기존 검증 결과 유효를 확인했다. 이번 요청의 원격 push는 하지 않았다. 작업 전부터 남아 있던 output/tmp·다른 worktree는 보존했다.

## 메인 푸시 요청

사용자가 후속으로 main push를 승인했다. origin fetch 후 origin/main...HEAD는0/3, 추적 파일 clean이며 dfc1c1563 구현·739b9adb7 통합 기록과 앞선 운영검수 문서443136b33만 미전달이다. source 변경은 없으므로 통과한 테스트/타입/lint/build를 반복하지 않는다. 승인 기록을 포함해 main에 일반 push하며 캐시·게이트 계약을 유지한다. push 성공과 Railway 운영 배포 완료는 구분한다.

## 운영 배포·전후 검수 진행

- 사용자 후속 요청: 배포 여부와 운영 영어 블록/그림짝 로딩·색칠 중복 요청·캐시/게이트 유지 확인.
- 원격 main db8aaf7f0와 로컬 SHA일치·0/0 확인. 2026-10-17T14:34Z 프런트 Railway 배포aad2ad84는 pending, 서버 watched paths 미변경 skip success. 운영은 이전 entry index-CWZAoTSe.js·health ok였다.
- CUA와 computer-use runtime 초기화가 같은 kernel assets 경로 오류로 실패했다. 기존 사용자 브라우저/저장소에 접근하지 않고 설치된 Chrome의 격리 QA context에서 운영 전후를 계측한다. 실제 태블릿/스피커 청취 검증과 구분한다.
- 캐시를 켠 같은 context의 이전 번들 측정과 새 context 최초 진입 표본을 별도로 모은다. 각 결과에 실제 entry를 붙여 배포 전환 중 섞인 표본을 구분한다. 증거: C:/project/tangobook/output/production-english-loading-20261017/.

## 운영 최종 결과

- 원격 db8aaf7f0 프런트 GitHub/Railway context `tangobook - tangobook`가 **2026-10-17T14:36:57Z success**, 배포 id **aad2ad84-293c-4072-95ec-2dafe4f15016**. 서버는 watched paths 미변경 skip success다. 운영 HTML entry가 **index-CWZAoTSe.js → index-CsFY1E6x.js**로 바뀌고 `/health` status ok를 확인했다. 이전 main push 성공과 운영 반영을 따로 확인했다.
- 운영1280×720 격리 Chrome의 같은 context/cache를 유지해 이전 번들3회→신규1회 워밍→각5회를 기록했다. 새 번들 재진입의 영어 블록은 **1285/1304/1308/1306/1245ms, 중앙1304ms**, 그림짝은 **703/764/744/758/769ms, 중앙758ms**. 이전의 캐시 채워진 후2회는 블록2505~2769ms·그림짝1147~1156ms였다. 표본 수/네트워크 변동 때문에 개선율을 보장하지 않는다.
- 첫 접속 별도 새 context3회 비교: 블록 **3806/3456/3298 → 4759/3322/3073ms, 중앙3456→3322ms**, 그림짝 **3481/3012/3371 → 3160/2788/3554ms, 중앙3371→3160ms**. 범위가 겹치고 편차가 커 **전체 최초 진입이 크게 개선됐다고 단정하지 않는다**. 목록 조회 시작은 블록2818~3105→1480~2091ms·그림짝2564~2998→1435~2049ms로 실제 앞당겨졌다. 코어 오디오 다운로드/새 번들·폰트/후속 UI 준비가 남아 있다.
- 배포 직후 최초 표본을 입력/캐시 검사와 동시 실행했을 때 중앙블록3987ms·그림짝3817ms였다(`after-cold-focused.json`). 검사끼리의 경합을 분리하려고 모든 작업 종료 후 단독 재측정했다(`after-cold-isolated-focused.json`). 두 결과를 모두 보존하며 더 나쁜 최초 결과를 숨기지 않는다. 1.5초 뒤 top100 백그라운드 요청과 일부 긴 core 준비가 겹치는 경우도 관찰했지만, 이 검수만으로 단일 원인이나 새 최적화를 확정하지 않았다.
- 색칠은 같은 개구리왕자 **ball**의 실제 도안/원본으로 비교했다. 이전3회 모두 원본2요청+도안1요청, 새 워밍/5회 모두 **원본1요청+도안1요청**이다. DOM `crossorigin=anonymous` 반영·실제 붓 입력을 확인했다. 준비 중앙값은1222ms지만 색칠 전체 시간 단축을 주장하지 않는다.
- 마지막 측정 행에 후속 입력 검사의 요청이 덧붙는 계측 스크립트 결함이 있었다. 원본 trace는 보존하고, 요청 집계는 각 측정의 ready+200ms 이내 요청 시작으로 한정했다. 후속 다른 입장을 색칠 중복 요청으로 잘못 집계하지 않는다. 성능 readyMs/entry 측정은 이 문제의 영향을 받지 않았다.

### 캐시·게이트·실제 입력

- 영어 블록/그림짝의 재진입 **정답 음원40응답(각20) 모두 CDP fromDiskCache=true**. Range/206 음원은 기존대로 SW를 우회하고 HTTP media cache를 쓴다. 새 Audio 준비 이벤트가 있어도 다시 다운로드한 것으로 해석하지 않는다. 색칠 도안/원본도 SW/디스크 캐시 재사용을 관찰했다.
- WebP2종 `public,max-age=604800`, 새 hashed entry `public,max-age=31536000,immutable`, 모두 조건부 요청304/본문0B. 운영 SW SHA256은 로컬과 같은 `8a57abbf06177dd4ad78335778e3bbcd38849dae07f206d3f5a533196bc5b389`. HTML/API의 동적 갱신·캐시 배제 및 기존 cache key를 바꾸지 않았다.
- 새 context1024×768의 영어 블록·그림짝에서 progressbar가 있는 동안 **알파벳 tray0·그림 카드0**, core 준비 후에만 player가 나타났다. gate 화면/실제 입력 화면을 직접 열어 확인했다. 재진입 그림짝은250ms 표시 지연 안에 끝나 bar가 보이지 않는 경우도 정상이며 필수 자산 대기를 생략한 것이 아니다.
- 운영 **소리 듣기→a배치→되돌리기**, **그림짝 카드 선택 강조**, **ball 붓 입력 후 실제 canvas 픽셀 변화/물감2종** 정상. 각 검사 pageerror0. 완주·학습 기록 생성/원격 콘텐츠 수정·새 push는 하지 않았다. 실기기 터치/스피커 청취 검증이 아니다.
- 저장 증거: `deployment.json`, `measurements.json`, `before-cold-focused.json`, `after-cold-focused.json`, `after-cold-isolated-focused.json`, `summary.json`, `cache-before.json`, `cache-probes.json`, `gate-input.json`, `*-gate.png`, `*-live-input.png`. 로컬 구현 테스트/타입/build 이후 제품 변경이 없으므로 검수 문서 diff/링크 확인만 수행한다.
