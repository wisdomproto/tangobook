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
