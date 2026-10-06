# 라이브러리 전용 폰트 제목 / 기존 표지 클린 재작화

- 상태: 진행 중
- branch: codex/library-cover-titles
- base: origin/main 22251615
- 작업 폴더: C:/Users/101024/.codex/worktrees/library-cover-titles/tangobook

## 사용자 요청

라이브러리 표지 위에 전용 폰트로 모든 언어 제목을 연결한다. 글자가 박힌 기존 명작(한/영), 전래, 호리, 자연관찰 표지를 재제작한다. 창작동화 850권 새 16:9 클린 표지와 본문/게임은 보존한다. 현재 작업 main push/배포 요청 없음.

## 실제 확인

- 기존 폰트 v0.2는 299 codepoints 시험판. 한글24음절/중국어8자/태국어 일부뿐이다. 기존 전체 제목에 바로 적용하면 대부분 fallback이므로 지원 확대가 필요하다. 미지원 문자를 지원한다고 보고하지 않는다.
- BookCard는 overlayTitle=false이며 resolveCover는 legacy 이미지를 우선한다. 클린 표지와 별도 제목 레이어로 변경한다.
- 운영 목록1310개: 동화1215(기존365 + 창작850), 파닉스95는 범위 밖. 기존365권 상세 원본을 D:/ComfyUI-output/library-clean-covers-20261006/books-before.json에 보존했다. 기존 cleanCoverImage214개가 있으나 사용자 재작화 요청365권은 그대로 유지한다.
- 실제 제목 번역은 en/vi/zh/th. 등록 언어11개와 실제 제목 번역 제공을 구분한다. 없는 번역을 임의 생성하지 않는다.
- 별도 최신 origin/main worktree를 생성했다. app 등록 작업은 creating에서 정체되고 attach는 ownerless 검증 실패했으나 실제 checkout 22251615/clean을 확인하고 새 branch를 만들었다. 다른 worktree 변경 없음.

## 완료 조건

클린 표지 365권 source/prompt/PNG/등록/CDN SHA 증거, 기존850/본문/게임 보존. 라이브러리 다국어 제목/전용폰트 실제 지원 범위 및 작은 화면/긴 제목 검증, 관련 로컬커밋. 미완료는 완료로 보고하지 않는다.

## 후속 사용자 반증

사용자: "헐.. 시험판이라고? 전체적으로 다 되게 만들어 폰트". 제목 subset 완성을 목표로 삼지 않는다. 한글11172음절/등록11언어 일반 문자 범위·실제1215권 다국어 제목을 검증한다. 전용 원형 유지+재배포 가능한 다국어 글리프 통합과 모든 글자 새 디자인의 선택 질문을 비동기로 요청했다. 혼합 제작을 원형 전체 직접 디자인이라고 보고하지 않는다. 선택 답변에 맞춰 실행한다.

표지 생성: builtin imagegen 첫 개구리왕자 그림체1 결과를 직접 비교했고 글자 없는 가로/동일공주개구리/황금공 정상. 이후364개 8동시 생성은 exec680 진행. 요청별 requests와 generated/failures를 보존해 불확실 요청 중복 금지. 자동 등록 없음. 경로 generated-images/library-clean-covers, 원본/생성계획 D:/ComfyUI-output/library-clean-covers-20261006.

## 전체 지원 확대 실제 진행

- 사용자 최신 전체 폰트 요청으로 제목 subset 목표를 폐기했다. 선택 질문은 선택적 선호이며, 답변 없는 동안 전용 조형+출처가 명시된 OFL 호환 글리프 통합 방식을 사용자에게 알리고 진행한다. 통합 글자를 전부 직접 디자인했다고 보고하지 않는다.
- 기존 v0.2 실제2415개 제목 audit: ko1215 중1205개 누락, zh290 중281개, th290 중283개 누락. en/vi는 기존 제목 문자 통과. 등록11언어와 실제 번역 제공은 구분한다.
- 자체 둥근 자모 조합으로 한글11172음절/현대 자모 생성. 첫 v0.3.0은 모든 cmap/잉크 통과해도 실제 출력의 굵기 차이로 기각했다. 굵기 보완본도 받침이 압축되어 dist-expanded-balanced에 받침 높이235/본체 위치390으로 재생성했다. 실제 TTF proof를 보고 조형을 대조했으며 제품 폰트로 게시하지 않았다.
- 다국어 호환 원본은 Noto 공식 파일/라이선스와 SHA를 font-sources에 보존했다. 첫 글로벌 merge는 CJK 전용 vertical table 때문에 실패했다. 수평 표지 텍스트에 필요 없는 donor vhea/vmtx/VORG만 제거해 수정 실행82321 진행. 소스 문자/한글 전수/11언어/actual title 검사와 실제 shaping 및 작은 화면 검증은 별도 필요하다.
- 새 library clean-cover/제목 레이어 코드: BookCover 관련 테스트11개 통과, client typecheck 통과. 아직 새 full 폰트 family/CSS 연결 및 브라우저 검증/배포 완료가 아니다.
- immutable snapshot edbff7673e6e의 71개 표지를 5개 contact sheet로 실제 원본/결과 육안 대조했다. 동일 작품/캐릭터/그림체·무제목·가로 구도 통과71개만 SHA 재확인 후 visually-approved. 등록83307 순차 실행 중이며 cleanCoverImage/coverImages만 갱신하고 기존 다국어 baked covers/본문/게임은 보존한다. 저장 CDN WebP 비율/버전 URL SHA 및 다른 필드 deep equality를 개별 확인한다. 미완료/거절 생성은 승인하지 않는다.
- 이미지 도구 거절 요청 일부는 실패 ledger로 분리했다. 같은 불확실 요청 중복 제출 없이 안전한 대표 장면으로 후속 구성한다. exec680 생성중 계획/요청 덮어쓰기 금지.
- 자동화16-9는 현재 작업을10분 간격으로 이어가도록 갱신했다. 전체 완료 전 비활성화/완료 보고하지 않는다. 최신 이 task가 오래된 session 상태보다 우선한다.

## 전체 폰트 지원 / 라이브러리 연결 검증 완료 (로컬)

- 최종 웹자산0.4.0은 제목 subset이 아니다. 한글11,172음절/현대 자모와 등록11언어의 일반 문자 범위를 포함한다. 자체 한글·보존된 전용 글자와 Noto OFL 호환 글리프를 구분하고 모든 문자권의 독점 새 디자인이라고 보고하지 않는다. 정확한 codepoints와 출처/라이선스는 public/fonts/tangobook-story-hand/0.4.0/manifest.json에 있다.
- 최종 balanced 한글을 글로벌 소스에 반영했다. sourceCoverage의 prototype/preview 표기는 소스 조합 단계 기록이며 웹자산의 전체 범위를 제한하는 뜻이 아니다. 생성 세션83317/85627 정상 종료, 새 폰트 producer 없음.
- 현대 한글 전수 cmap/빈 contour 검사 누락0. HarfBuzz 실제11언어 표본과 제목2,415개 shaping에서 notdef0. 실제 Chromium11언어38px/18px proof와 라이브러리 한국어/영어/태국어/베트남어/중국어 전환·긴 제목/작은 카드 표시를 확인했다. current learner picker5언어와 글꼴 지원11언어는 구분하며 없는 번역은 한국어로 돌아간다.
- 93개 WOFF2 shard는 각 전체 source 범위를 합집합으로 보존한다. 실제 로컬 HTTP 응답93개 모두 manifest SHA 일치. 전체 용량7,444,348bytes, 필요한 문자 묶음만 내려받는 unicode-range CSS. 저장 screenshot은 font-browser-review/eleven-languages.png 및 library-ko/en/th/vi/zh.png이며 브라우저 출력과 저장 한글 proof/HarfBuzz 결과는 별도 증거다.
- BookCard/Editable/FirstReadCard가 cleanCoverImage 위에 별도 언어별 제목을 표시한다. legacy baked 표지는 클린본 확보 전 이중 제목을 넣지 않는다. 지역 언어 태그 소문자 정규화와 제목NFC/정규화 길이 기준 적용. 전체 폰트를 UI 일반 본문까지 바꾸지는 않았다.
- client typecheck 및 build 통과. 최종 NFC/지역태그 보완 후 관련3파일15tests 재통과. build의 기존 Browserslist/Lottie/chunk 경고 보존. 운영 preferred-font DB/R2 등록 및 main push/코드 배포는 하지 않았다.
- 표지는 기존365권 전수 재작화 계속 진행: 실제 generated247, failures6, registered-verified71 snapshot. 등록71은 CDN 버전 SHA/가로비율/표지외 데이터 보존 완료이고 생성247을 등록/검수 완료로 확대하지 않는다. 창작850권은 실제 전부 cleanCoverImage가 있어 별도 수정하지 않는다.
- 남은 실행은 exec680 8동시 표지 생성 하나이다. 중복 생성/불확실 요청 재제출 금지. 다음은 남은 immutable ID/SHA contact sheet 검수와 검증한 표지 순차 등록, 실제 거절6건의 안전한 대표 장면 후속이다. 폰트 지원은 완료했지만365 표지 재작화 전체 작업은 아직 완료하지 않았다.

## 폰트 로컬 커밋 / 다음 표지 묶음

- 폰트·UI·관련 스크립트·기록은500ded7b 로컬 커밋 완료. 실제 hooks eslint/prettier 통과, 마지막 client typecheck 재통과. main push/운영 코드 배포 없음. 검수용 폰트/library 임시2탭만 닫았고 사용자gallery tab1 보존.
- immutable snapshot d85b842efb27의 다음191개 표지를12시트 전부 실제 원본/표지 대조했다. 작품/캐릭터/그림체/주요 장면·무제목·가로 구도 통과한191개만 PNG 실제 SHA 재확인 후 visually-approved로 기록. 이후 생성은 이번 육안 검수에 포함하지 않는다.
- approved-d85b842efb27.json의191개 순차 등록을 exec779로 시작했다. 실행중 중복 등록 금지, cell이 shell session ID를 반환하면 해당 session의 종료/ledger를 확인한다. 이미 등록한71개와 이번191 승인/진행중 등록 수를 구분한다. raw 생성 exec680은 계속 진행하고 전체 완료 전 재시작/자동화 종료하지 않는다.

## 19:27UTC 후속 — 실제 등록262 / 추가49 순차 등록

- 실제root/branch/status/worktree 재조회, HEAD0f424197(폰트500ded7b+문서)와 기존미추적 prototype/생성 PNG를 보존했다. 폰트 재빌드/새push/배포 없음.
- 앞191 순차 등록 session58774 정상 exit0. 실제 ledger191 전부registered-verified, 프로세스76416 종료 재조회. 기존71과 합계262권 클린표지 CDN/비율/표지외 필드 검증 완료.
- 다음 snapshot2e6a0f761433의36권3시트와35e17ccee6ab의13권1시트를 실제 원본/선화 아닌 새 표지와 대조했고 작품 주제·그림체·대표 장면·가로 구도·무제목 통과. immutable ID/SHA 및 PNG SHA 재확인한49만 visually-approved 기록. 이미191등록이 끝난 뒤 새 순차등록 session90420 시작, 아직진행중이므로 중복 registrar 금지.
- 생성 exec680은 계속진행: actual generated322 / failed-or-uncertain9 snapshot. 이후 생성은 이번 육안 검수에 포함하지 않는다. 전체365완료가 아니다. 실패9 중 기존6의 image tool 거절은 앞 기록, 새3(1777266835789 피노키오2/1777272102062 라푼젤2/1778555233699 백설2)는 실패ledger와 옛submitted-or-running request만 현재 확인했다. 오류 종류/출력 확정 전에 같은요청 재제출하지 않는다. functions load cover-failure-ID에 값이 없었으므로 저장 오류를 읽었다고 보고하지 않는다.
- 다음은90420 종료/ledger 확인, 아직검수하지않은 새 생성 immutable시트 검수·반영, 마지막 producer 정상종료 후 불확실 요청/실제 출력 원본 SHA를 대조하여 안전한 후속. 모든850창작/본문게임은 보존하며 자동화10분 유지.

## 19:58UTC 후속 — 클린 표지359 등록 / 도구 거절6 판단 대기

- exec680 정상종료: 첫 별도1+묶음353=354 저장, failed-or-uncertain11. 원래365 계획/실패/request 기록을 보존하며 완료 producer 재시작하지 않는다. 폰트0.4.0 및 UI 로컬 완료 상태는 유지하고 재빌드·main push·운영 코드 배포 없음.
- 앞49 session90420 exit0 →19 session17918 exit0 →17 session19394 exit0 →마지막7 session79979 exit0 순차 실행. snapshot f888b3d25c4f/21fafcf86f0d/70b063ff5893의 실제 원본·새 표지 전시트 대조/SHA 승인 후 등록했고 정상 원래354권 전부 registered-verified.
- 실패11 원본 cover/본문 paired contact 00·08 실제 육안 대조. 기존6의 실제거절/새5의 불확실 원래 오류 종류는 구분했다. 완료 producer에 saved output 없는11에 새 alternate-scenes-plan/alternate-requests를 먼저 고정하고, 이전 실패 요청과 다른 평화로운 대표 장면을 새 builtin 호출로 생성했다. 생성 reference=[]인 텍스트 기반 새 구도이며 원본 사진을 도구에 넣었다고 보고하지 않는다. 원래 references SHA는 보존했다.
- 새 알라딘2(램프/시장), 정글북2·3(동물 숲), 라푼젤2·1(탑/긴머리 환경)5개는 실제 paired sheet8c5dc9e41c8d 대조로 작품주제·매체·무제목·가로 통과. 새로운 실제 prompt/reference 출처를 saver followupRequest로 저장하고 session46651 정상exit0 등록.5 PNG/실제 CDN WebP 버전SHA·16:9·표지외 전체필드 deepcompare 통과. 큰 generated-images 디렉터리의 alternate-requests.json에 실제 재시안 요청·상태도 저장.
- **남은6**: 피노키오2 1777266835789/백설2 1778555233699/백설3 1789350946295/피노키오3 1789350946328/피노키오1 1789350946329/앨리스3 1789350946347. 새 평화로운 시안도 HTTP400 moderation_blocked(output/other) 거절, 실제 error/requestID를 alternate-requests에 보존했다. 같은 요청 반복/필터우회/자동 모델 전환 금지. 사용자에게 별도 API 키가 필요한 imagegen CLI/API 방식 전환 또는6기존표지 보존 선택을 비동기로 요청했다. 답변 전 종속 생성은 진행하지 않는다.6권을 등록 완료로 확대하지 않는다.
- registration-audit-final-pending-six.json: 실제359 registered ledger의 protected before/after 전체필드 재대조 및 저장CDN SHA/가로비율 재확인. CDN 버전URL 다운로드는 각등록 시 실제 수행한 증거이며 이번359 새브라우저검증으로 보고하지 않는다. 현재1310 목록 재조회 preservation-audit.json:850창작+95파닉스 cover/cleanCover/coversByLang/title/titleTranslations/pageCount 불변. 이 목록감사를850본문 새deepcompare라고 확대하지 않는다. frozen365 외 registrar 수정 불가.
- saver alternate metadata guard 및 immutable original source 비교시트 보완, JS node --check2/py_compile 통과. 기존 서버·gallery1 보존, 임시탭 추가없음. 자동화10분은 판단 대기·거절 재제출 금지로 갱신한다. 전체365완료 알림/자동화 비활성화 조건은 아직 충족하지 않았다.

## 사용자 image skill 재요청 — 2026-10-06

사용자 "뭐냐 image skill 다시 써서 만들어봐"는 남은6권 builtin imagegen 재시도를 명시 승인했다. 이전 API 선택 대기를 대체하며 API/다른모델 전환 승인은 아니다. user-requested-imagegen-retry-20261006에 이전실패/request와 별개 실제6요청·사용자승인·prompt·reference=[]를 먼저 고정했다. 평화로운 원래 alternate prompt를 유지한6개 개별 builtin 호출 exec844 진행. 요청별 submitted/실제출력path/오류를 즉시저장하며 중복실행·기존failure덮어쓰기·필터우회 금지. 기존359등록/850창작/95파닉스/폰트와운영배포 상태는 보존한다. 새 결과만 실제16:9/SHA/무제목·작품 검수 후 순차등록한다.

exec844 정상종료: 피노키오3 1789350946328만 새PNG 1672×941/SHA5ec9011333dd6398f77ce7fd122267a845c1f2a937941b7e24bba4b1ad352241 생성. paired snapshot aca9caf79c04 실제원본·새결과 대조로 수공콜라주·노인목공/옷입은긴코나무인형·작업실·무제목/가로 구도 통과 후 실제PNG SHA 재확인하고 승인. 단독 registrar 정상exit0/registered-verified, 실제CDN WebP ?vSHA·가로비율/최신책동시변경/표지외전체필드deepcompare 통과. **현재360/365 등록/남은5** 피노키오1·2/백설2·3/앨리스3은 이번도 HTTP400 moderation_blocked(output/other), 실제5오류/requestID를 개별retry에 보존. 원래실패/이전alternate는 덮어쓰지않음. 6개재시도 요청과결과를 workspace generated-images/library-clean-covers/user-requested-retry-20261006.json에 저장, 최신 registration-audit-after-user-retry.json 참조. 사용자의 builtin 재시도1회는 완료했으며 자동반복/다른모델 전환하지 않는다. 기존 API/보존 선택 답변은 여전히없다. 전체완료로보고금지/운영UI배포mainpush없음/서버gallery보존.

## 두 번째 사용자 재시도 — 앨리스 추가 / 현재361

사용자 "허허 왜 안되지.. 다시 해봐"로 남은5권 builtin 개별재시도1회 실행완료. latest-user-retry.json에 별도시각이름 요청폴더/auditFile 포인터를 기록하고 모든이전실패·실제prompt/reference=[]·error/requestID 보존. 앨리스3 1789350946347 새PNG1672×941 SHA695bbd8e9b87d04d8087f7b5a27d4d651774b368f93c3287bccc8ac3b68fe012 생성, actualpaired시트d56b23d56a57에서 금발/보라드레스흰앞치마·흰토끼·콜라주차정원·무제목가로구도 확인/SHA승인. 단독registrar 정상exit0/registered-verified, actualCDN WebP ?vSHA·16:9·표지외전체필드deepcompare 통과. **현재361/365 등록·남은4** 피노키오1 1789350946329/피노키오2 1777266835789/백설2 1778555233699/백설3 1789350946295는 이번도 HTTP400 moderation_blocked(output/other). 구체적거절이유를 도구가제공하지않았으므로 원인을추정하지 않는다. registration-audit-after-user-retry2.json 및workspace user-requested-retry2-20261006.json이 최신이고 앞360/5기록을대체. 사용자의1회재시도완료/자동반복·모델전환금지,운영UI mainpush/배포없음·기존서버갤러리보존.
## 사용자 지정 Qwen-Image-2.1 후속 — 남은4권

사용자 "그럼 나머지는 qwen2.1 로 만들자."가 남은4권의 로컬 모델 변경을 명시 승인했다. 이전 builtin 재시도/선택 대기를 대체하며, 기존 실패 요청은 보존한다. 실제 Comfy8190이 꺼져 있어 다른 프로세스를 중단하지 않고 설치된 Qwen-Image-2.1 모델을 확인한 뒤 새 서버 PID83504를 lowvram/localhost8190으로 시작했다. worker PID76072/session91135가 qwen-local/status.json·worker.lock·요청별 promptId/workflow/history를 보존하면서4권 순차 후보 생성 중이다. 첫 요청 b4ee9f83-df05-4a42-9113-2c69a09bbc21. 기존 본문 삽화 각각1개를 실제 육안 확인/SHA 검증한 참조로 사용하고, Comfy ImageScale1024×576/resolution0으로 정확한16:9를 지정했다. 생성과 등록을 구분하며 자동승인/등록하지 않는다. saver는 실제 Qwen 모델·history success·실행graph·참조SHA·출력SHA를 검사하고 tool을 local-qwen-image-2.1로 별도 기록한다. 기존builtin 기록은 변경하지 않는다. 공개361/365이며4개 후보 검수/등록은 아직 미완료. 운영mainpush/코드배포 승인 없음.

## Qwen 후속 완료 — 365/365 등록·검증

첫 후보는 Comfy autogrow 참조 연결 키를 잘못 지정해 기존1280×720 참조가32배수로 반올림된1280×704로 생성됐고 saver가 등록 전 거부했다. actual success history/원본PNG/workflow/request를 qwen-local/attempt1-wrong-reference-size에 보존했으며 미등록이다. images.image_1을 ImageScale1024×576에 연결한 수정 workerPID7056/session19112는4개 전부 정상종료(all-candidates-awaiting-review), 끝8190 queue0/lock없음 확인. 모델은 실제 Qwen-Image-2.1 int8/25step이며 builtin 결과로 보고하지 않는다.

4개 PNG모두1024×576. 실제4원본/개별결과/immutable paired시트 snapshot176724a37fce 대조: 피노키오2 목공과옷입은관절인형·입체종이그림체/백설2 입체종이꽃드레스·새·성/백설3 질감콜라주꽃드레스·정원/피노키오1 수채풍목공·나무인형·작업실 유지, 글자없음/가로구도 승인. 각 actualhistory success/graph/source/candidateSHA 확인후 순차registrar session94151 정상exit0. cleanCoverImage/coverImages revision만등록, 기존legacy bakedcover/primarylangs/본문게임보존 protected전체필드deepcompare, CDN WebP ?vSHA·16:9 실제다운로드 통과.

- 피노키오2 1777266835789: PNG SHA71be1800c77c5bd6db0f4aae65473ce1782d93fa8b43402acf76353e5693d49e.
- 백설2 1778555233699: PNG SHA8d1c6fb282d8368d0a84bac4d9ab97915fab82f6246148e385be9cea347d1f5a.
- 백설3 1789350946295: PNG SHA06474fb26ab8317023ed3284551d1bc5641dbd8583f039f7b8eef634d0484556.
- 피노키오1 1789350946329: PNG SHA3159d03adec4a16c6287a0fd8cd4986079986c67e26ee4e6fe933b728ed86d0b.

새요청/workflow/history/approvedrecord를 workspace generated-images/library-clean-covers/qwen-final-provenance와실제PNG로 보존. 원래builtin실패 및이전요청은 덮어쓰지 않았다. audit-library-clean-covers.mjs 실제실행: registration-audit-complete.json 365registered ledger의보호필드before/after·저장CDNSHA·비율 전수재확인, 현재1310목록 재조회하여 frozen365밖 창작850+파닉스95의cover/title/pageCount등945목록 불변 확인. 목록감사를945본문 새deepcompare나365브라우저 새검수로 확대하지 않는다.

**무제목표지365/365 완료.** 전용폰트0.4.0/라이브러리언어별titleoverlay코드는앞서로컬완료, 이번에도main push/운영UI코드배포는 하지않았다. 운영라이브러리는UI배포전legacy제목표지fallback을보존한다. 관련JS node --check/worker py_compile/diff확인 통과, 새UI수정없어앞테스트/브라우저증거를새실행으로보고하지않는다. 사용자gallery1/기존서버보존·임시탭추가없음. 전체표지완료조건충족으로후속16-9 비활성화.

## 사용자 표지 제목 크기·색·누락 번역 수정 — 2026-10-06

사용자 실제library 화면에서 제목이작음/표지마다색조정필요/중국어선택에도전래·호리탐험·유치원한글제목남음을 반증했다. BookCover 짧은제목6.8cqw→9.8cqw(약44%확대), 중간제목8.4cqw/긴제목7.6cqw로줄바꿈공간유지. 1215검증된CDN표지의상단제목영역픽셀을분석해밝은표지는진한숲색/자주색,어두운표지는밝은크림/금색과대비테두리를선택. build-library-title-colors.py는등록ledgerCDNSHA를검증한로컬WebP만읽어URL별색JSON을생성하며원본이미지/런타임색칠/폰트원본을변경하지않는다. 새표지URL은기본크림테두리로안전fallback, 기존색manifest는해당URL에만적용.

실제frozen책자료에서전래40권은영어만/호리탐험15권·유치원20권은titleTranslations미제공이었다. legacy-library-titles.ts에75작품의en/vi/zh/th표시번역보충, shared bookDisplayTitle가저장번역우선→보충목록→한국어원제순으로해결하고그림체접미사/시리즈번호유지. 새로운본문번역이나R2책데이터일괄쓰기아님. 한글원제와기존번역/표지본문게임보존. client관련14테스트통과(3분류zh-CN fallback/저장번역우선포함), shared/client typecheck 및shared build후실제Node ESM300제목검사(75권×4언어,한글fallback0)통과. eslint0error/기존test any경고2개.

별도headlessEdge실제local5240 한국어·중국어1877px,중국어·태국어·영어·베트남어390px 각98카드텍스트검수/가로overflow0/4색실제표시. 초기베트남어locale전환중0카드snapshot은증거로채택하지않고별도안정상태98카드재확인. 작은영어화면태양계긴제목높이진단후중간제목크기별도보완. 스크린샷/JSON은D:/ComfyUI-output/library-clean-covers-20261006/title-*에보존. 사용자gallery/기존tabs보존·headless브라우저종료. 현재로컬Vite즉시반영·운영push/배포없음.


## 사용자 글자 조형 혼합 반증 및 썸네일 조사 — 2026-10-06

사용자 첨부 신데렐라/전래 화면에서 같은 제목 내 서로 다른 조형을 발견. 브라우저 fallback이 아니라 full_hangul이 초기24개 한글을 건너뛰고 보존해 확장11148자와 다른 제작법이 들어간 원인이 실제 cmap/원본과 일치한다. 신·데·렐은 확장, 라는 초기 glyph. 기존 notdef0/전수 cmap은 글자 존재 검증이며 디자인 통일 검증이 아니었다. 초기 글자는 역사판에 보존하고 현대11172자와 자모를 한 조형/획굵기로 통일하는 0.5.0 로컬 교정 중이다. 다른 문자권도 부분 trial 글자와 Noto 혼합 대신 각 문자권의 출처 명시 Noto 전체 face를 선택해 내부 혼합을 없앤다. 전 문자권 독점 새디자인으로 보고하지 않는다. 완료/실제브라우저 여부는 아래 후속 검증절에만 기록한다.

사용자 넷플릭스/유튜브 제목 크기·위치·색 조사 요청. agent-reach 경로 확인: Exa backend 미설정, builtin web검색과 실제 headlessEdge 공개페이지/예시 이미지 확인을 사용했다. 사용자 로그인/갤러리 탭 변경 없음. agent-reach check-update v1.5.0 최신.

- YouTube 공식 https://support.google.com/youtube/answer/12340300?hl=en : 읽기 쉬운 서체, 복잡성 줄임, 기기별 표시 확인, 내용과 제목 정합성을 권장. 실제 craft before/after는 사진 위 작은 텍스트 대신 단순 띠의 큰 검정 제목 사용; HERE’S WHY 예시는 어두운 배경 위 흰 큰 제목. 모든 영상에 텍스트가 있는 것은 아님.
- Netflix 공식 https://netflixtechblog.com/artwork-personalization-c589f074ad76 : 같은 작품 artwork 여러종/구도 다양성. 이 글의 Stranger Things 9종 예시를 공개 재현 이미지로 실제 확인했으며 빨강/흰색 타이틀과 좌측/우측상단/하단 등 다른 배치가 보인다. 공식 한국/미국 genre 브라우저 URL은 현재 랜딩으로 전환돼 실제 로그인 카탈로그를 검증했다고 보고하지 않는다.
- Netflix 공식 https://netflixtechblog.com/discovering-creative-insights-in-promotional-artwork-295e4d788db5 : TV/모바일 UI별 크기와 종횡비에 따른 실제 검증 필요; 단일 보편 규칙/px 지정 자료가 아님.

TangoBook 제안 수치는 플랫폼 공식 규격 또는 평균 계측값이 아니다: 280px 폭/약158px 높이 카드에서 짧은 제목28~34px, 긴 제목22~28px/최대2줄, 좌우 안전여백6~8%, 얼굴·핵심행동 피한 상/좌/우/하 여백. 제목 bbox가 실제 들어갈 영역의 밝기/복잡도를 기준으로 크림색과 진한 숲색·자주색 선택, 필요할 때 얇은 대비 외곽선/부분 그라데이션. 전체이미지 평균색만으로 대비 보장 불가. 축소된 실제 카드에서 5언어 긴 제목과 얼굴겹침을 점검해야 한다. 이번 조사만으로 대량 cover 재생성/운영UI 배포 승인으로 확대하지 않음. 증거 D:/ComfyUI-output/library-clean-covers-20261006/youtube-thumbnail-research.png 및 netflix-artwork-grid-research.png.


### 0.5.0 로컬 적용 검증 및 제목 굵기 보정

초기24개 skip 제거·자모 모두 재구성/같은 획폭64 적용. 중간125폭 샘플에서 압축된 획이 합쳐지는 문제를 육안으로 보고 제품 적용 전 교정했다. 실제11172개 glyph의 좌표·flags·contour·자폭을 생성 규칙과 전수 대조(11172/11172); 초기 예외0. 공개폰트0.5.0은 완전11언어 범위 유지/93파일. Latin/Chinese/Japanese/Thai의 ownGlyphCount0으로 초기부분trial 혼합 제거, 각 출처 명시 Noto face 사용. 한국어 자체 조형과 Noto 글자 출처를 분리하며 독점 전체서체라고 보고하지 않는다. 실제2415제목/11언어 HarfBuzz notdef0.

브라우저 1차에서 transformed Korean WOFF2가 OTS Failed to convert WOFF2 to SFNT로 거부되어 맑은고딕 fallback으로 나타났다. HTTP SHA/cmap만으로 성공 처리하지 않았다. 생성기의 Korean만 표준 untransformed WOFF2로 내보내는 옵션을 적용; 잘못된 중간파일은 D:/ComfyUI-output/library-clean-covers-20261006/uniform-korean-transformed-rejected.woff2에 별도 보존하고 제품 파일을 교체했다. 다른93전체manifest SHA를 실제localhostHTTP전수 다운로드 재검증. 실제 headlessEdge 신데렐라 glyph4가 전용font/customFont=true/fallback0이며 11언어38/18px proof에서 한국어 FontFace check true/error faces0. proof와 실제library screenshot은 verification-uniform; 시스템fallback 1차는 성공증거 아님.

사용자 추가 '우리 폰트 두께가 너무 작은가 글씨가 잘 안보이네' 반증에 BookCover 제목 렌더weight400→700, textstroke0.055em→0.035em로 조정. 소스Regular를 title rendering에서 Chromium synthetic bold로 표시하며 실제Bold 원본 제작으로 보고하지 않는다. 본문/UI 기본폰트는 유지. 실제KO library 새스크린샷은 변경후 기록/신데렐라 customfont4 확인. 썸네일 위치별 디자인 제안은 조사 기록이며 이 변경에서 전체 표지 위치를 자동재배치하지 않았다.

관련 BookCover 테스트10개/클라이언트 build 통과(기존 Browserslist·큰chunk·lottie eval 경고). Python 검증 환경에서 uharfbuzz가 없었던1차는 실패로 구분하고 동일 Python환경에 설치 후 실제shaping 재실행 통과. 사용자 브라우저 2탭/기존서버·다른작업·공개이미지 보존; local5240 즉시 적용, main push/운영코드배포 없음.

## 사용자 기본 폰트 선택 및 빈 표지 후속 — 2026-10-06

사용자는 0.5.0이 원래 손글씨 전용 디자인이 아니라는 반증 뒤 '그럼 일단 기본 폰트로 하자'를 선택했다. 0.5.0은 한글 규칙 기반 재구성+타 문자권 Noto이며 원래 B 손글씨 디자인을 보존한 완성본으로 취급하지 않는다. BookCover 전용 family override를 제거하고 앱 기본 body 서체를 상속한다. 실제 headlessEdge 무당벌레 제목 CDP Pretendard Variable / PretendardVariable-Bold / glyph4 확인. 중국어·태국어는 기존 body의 Noto Sans SC/Thai 설정을 상속하며 제목 번역·색·크기는 보존. 전용 폰트 파일/원본 소스는 삭제하지 않았다.

사용자 스크린샷 곤충 행 무당벌레/개미/호랑나비 빈 표지 반증. 별도 headlessEdge 실제 현재 원본 URL 세 장 모두1536px 정상응답으로 확인되어 사용자 세션의 정확한 요청 실패 원인을 재현했다고 단정하지 않는다. 코드상2.5초 watchdog이 느린 원본 요청을 재마운트하며 4회 한도 후 복구 선택이 없었다. 감시를12초로 늘리고 썸네일 스톨에도 원본으로 폴백·eager 로드한다. onError 지연타이머는 소스/재시도 변경·로드 성공·unmount 때 정리한다. 재시도 한도 뒤 직접 다시 불러오기 버튼 추가(카드 링크 전파/이동 방지).

회귀17개 통과, client typecheck 통과. 실제 headlessEdge 네트워크실패1회 주입 뒤 세 곤충표지 모두naturalWidth1536 및 Pretendard Bold 확인. 증거 D:/ComfyUI-output/library-clean-covers-20261006/default-font-cover-recovery.json 및 png. 1차 브라우저검증은 재마운트 중 detached locator로 실패; 안정된 부모를 스크롤한 재실행만 성공증거. 사용자 탭/서버/기존365표지/850창작/파닉스 데이터 변경 없음. 이번 코드는 로컬5240 적용, mainpush/운영배포 없음.

## 이전 표지 로딩 해결책 대조 및 신규 썸네일 누락 복구 — 2026-10-06

사용자 추가 스크린샷에서 호리 유치원 행 전체/공룡·곤충 일부 빈표지가 재발. '기존에 어떻게 해결했었는지도 찾아봐' 요청에 실제 Git와 과거 메모를 대조했다. 5a7b45c4는 native lazy가 가로 행에서 발화하지 않던 문제를 첫3장 eager+회복요청 eager로 교정. c746b88d는 1536px 원본으로81카드 약11MB를 받던 문제를512px WebP 썸네일로 줄였고1239/1243생성/당시81카드 전부512px를 검증했다. cover-thumbnails-2026-07-25.md와 루트CLAUDE는 새 표지 등록 후 썸네일 생성 필수라고 명시했다. 새0.4/0.5 제목코드가 이 로딩코드를 삭제한 것은 아니다.

이번 실제 HTTP 무당벌레 신규 clean원본200/191650byte와 유도thumb404를 확인했다. scroll-load-before.json의 실제14행 페이지는 원본1536px를 받고 있었다. 신규365+창작850 표지 등록 뒤 썸네일을 생성하지 않은 릴리스 단계 누락이 확인된 문제다. 앞선3장 실패주입 검증/12초재시도 보강으로 전체 해결이라고 확대할 수 없다.

기존멱등 generate-cover-thumbs.mjs --apply를 현행 live목록2663개 coverURL에 실행(기존thumbnail skip, 원본/본문/게임/책JSON 불변). 무당벌레 새thumb는 실제CDN200/33256byte. BookCover는 priority외 카드의 src를 화면250px근처 IntersectionObserver 진입 전 부착하지 않고 진입시 eager로 요청: native lazy의 가로행 미발화와 모든행첫3장 eager 요청폭주를 함께 피한다. observer미지원 환경은 eager 안전폴백. 과거priority첫2장 프리렌더 처리는 유지. 실제화면밖 eagercard가 요청하지 않다가 진입시thumb요청하는 회귀추가. 18테스트/clienttypecheck 통과.

중간 실제 headlessEdge14행 좌우28확인에서 노출표지 모두로드/97고유제목 확인, 초기image25. 생성 진행 중이므로 일부thumb404→원본폴백23이 있어 전부thumbnail완료 증거로 취급하지 않는다. 최종생성/검수 수치는 아래에 추가한다. 사용자2탭/서버/다른worktree보존, mainpush/운영코드배포 없음.

### 최종 생성·실제 페이지 확인

동일프로세스 정상종료: 대상2663, 신규1612, 기존1051skip, 실패0, 다운로드절감합378.1MB. thumbnail-backfill-result.json에 실행결과/명령/검증수 보존. 전체1215 책 원본표지/본문/게임JSON을 수정한 것이 아니라 목록에 참조되는 표지의 파생thumbnail만 생성했다.

생성완료 후 새 headlessEdge 세션으로14행 전부 좌우28위치 재검수. 고유표지97개 모두실제naturalWidth512, blank0, 요청실패0, thumbnail응답97. 초기화면근처요청25로제한. cover-scroll-after.json 및 png에 실제결과저장/스크린샷육안확인. 사용자스크린샷에 빈칸이었던호리유치원/공룡/곤충행 포함. 테스트18통과/clienttypecheck통과/clientbuild통과(기존Browserslist/lottieeval/큰chunk경고). 접근성placeholder에도제목이름유지/최종18테스트재실행. 사용자탭을새로고침하거나닫지않았고 로컬5240코드만적용, mainpush/운영코드배포없음.

재발방지: 앞으로 cleanCoverImage/대표표지를교체할때 기존7월릴리스절차대로 generate-cover-thumbs.mjs --apply를 수행하고 실제library naturalWidth512를 확인해야한다. 이번작업에서 기존등록producer/폰트build를재시작하지않았다.

## 사용자 써라운드 선택·확대·하단 배치 — 2026-10-06

사용자는 써라운드를 선택하고 더 큰 크기/아래쪽 배치/의미 있는 두 줄 줄바꿈을 요청했다. 한국어 제목에 원본 Cafe24 Ssurround WOFF를 변경 없이 로컬 제공한다(공식 Cafe24 라이선스·출처·SHA README 보존). TangoBook 자체 제작 폰트라고 보고하지 않는다. 다른 문자권은 기존 앱 언어별 서체를 유지한다.

BookCover에서 CoverTitle을 분리하고 하단5%/좌우6% 배치, 권장 크기를 카드폭9.8%→12%(256px 카드 약25→30.6px)로 확대했다. 기존 표지별 대비색과 어울리는 부드러운 하단 그라데이션을 추가했다. 실제 font 측정/로드 완료/resize에 맞춰 최대2줄로 표시하며 단어 중간은 자르지 않는다. 긴 한 단어 공룡 이름은 한 줄 크기를 조정한다. 한국어 일부 제목은 조건·결과/문장부호·의미 구절별 예외를 지정하고, 띄어쓰기 없는 중국어·일본어·태국어는 Intl.Segmenter 단어 경계를 사용한다. 저장 제목·번역·원본 표지 데이터는 변경하지 않았다.

실제 API1310책 한국어 제목의 한글 cmap 누락0. headlessEdge 신데렐라 실제 Cafe24 Ssurround/customFont=true/glyph4 확인. 데스크톱1854px·모바일390px ×KO/EN/ZH/VI/TH 총10화면, 화면별 약98제목의 최대2줄·가로 넘침 없음 확인. surround-bottom-review.json/1854·390 PNG를 D:/ComfyUI-output/library-clean-covers-20261006에 보존하고 실제 화면 육안 확인. 이 제목 검증을 새 전체 표지 로딩 검증으로 확대하지 않는다(이전14행97표지512px 로딩 증거 보존). 사용자 탭과 기존5240서버 유지, 원본/본문/게임/R2 변경 및 mainpush/운영배포 없음.

최종 검증: BookCover·stall 16회귀와 줄바꿈6회귀 통과, client typecheck 및 build 통과(기존 Browserslist/lottie eval/큰 chunk 경고). 의미 구절 수정 후 실제10화면 재검증도 통과.
