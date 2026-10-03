# 창작동화 01~10 핵심단어 삽화

- id: 20261003-changjak-word-images
- domain: content
- status: integrated
- updated: 2026-10-03
- base: 4fcf3bb0b
- branch: codex/content-changjak-word-images
- worktree: C:/projects/tangobook/.worktrees/changjak-word-images
- integration: origin/main 기반 fast-forward 통합
- delivery: 사용자 main push 승인

## 요청과 완료 조건

사용자는 창작동화 목록의 01~10번 시리즈, 각 책에 이미 추출된 핵심단어의 삽화를 GPT 이미지 스킬로 만들도록 요청했다. 기존 카드 크기를 참고하여 불필요한 고해상도를 피하고 여러 단어를 한 장에 생성한 뒤 잘라 쓰는 방식을 승인했다. 운영 단어 목록·그림체·본문 문맥을 기준으로 단어별 결과를 생성·검수하고 책의 핵심단어 이미지에 연결한다.

## 결정과 진행

시리즈: pongi/coco/mei/dodo/bruno/twins/mio/pipo/nono/lulu. 운영 목록 읽기와 이미지 규격 확인부터 진행한다. 같은 시리즈·같은 뜻의 단어는 재사용한다. 다른 뜻 또는 사물 디자인은 별도로 생성한다. 사용자 지정 GPT 이미지가 로컬 기본 Qwen보다 우선한다. 기존 책과 이미지 목록은 변경 전 백업하며 본문·다른 자산은 보존한다.

## 검증 및 다음 행동

핵심단어 수와 기존 이미지 유무를 조회하고 등록 대상·출력 크기를 기록한다. 생성 원본/분할 카드/검수·등록 ledger는 이 작업 폴더 generated-images/에 보존한다.

2026-10-03 후속 결정: 모든 단어 삽화 생성 후 01~10 시리즈 운영 책 데이터에 등록하여 Editor2와 동기화한다. 이미 동기화된 본문 페이지·삽화·소리·번역과 기존 단어 이미지는 보존한다. 조회 결과 500권, 핵심단어 2,363개, 시리즈 내 단어명 기준 839종, 기존 단어 이미지 0개다. 생성 시 뜻과 사물 디자인 차이를 추가 구분한다.

현재 생성 manifest는 뜻을 구분한 857종, 147장(3×2 칸)이다. 실제 운영 본문 첫 쪽을 시리즈별 그림체 참조로 첨부하고, 첫 쪽에 캐릭터가 없는 dodo/pipo는 캐릭터가 보이는 본문 쪽도 추가했다. GPT subscription-native image_gen을 최대 4장씩 병렬 호출하며, 원본은 보존하고 최종 카드는 최대 500×500 WebP quality 82로 분할한다. `scripts/changjak-word-*.{mjs,py}`와 generated-images/changjak-words의 jobs/cards/reviews/registration 파일로 재개한다. 진행 중 jobs를 prepare로 다시 만들면 보정 프롬프트를 덮어쓰므로 재생성하지 않는다.

검수 반증: coco-010의 '나무'는 본문에 나무 통/나무 공이 나와 최초 그림도 물통으로 생성됐다. 독립 학습 카드로는 '물통'으로 보이므로 기존 5칸을 유지하고 통나무·판자로 교체하는 편집을 같은 생성 큐에 추가했다. '잠자리'는 coco-22 본문상 침대/잠자는 자리이므로 곤충으로 고치지 않는다. 등록은 모든 생성·육안 검수 후 시행하며 현재 미등록이다.

추가 검수: coco-010 보정본 통과. pipo의 '방울'은 pipo-03/23의 목 방울과 pipo-09의 우유 한 방울로 나눠 858종이 됐다(147장 유지). twins-012 '어부'가 사람으로 나왔으나 본문은 토끼 아빠이므로 운영 twins-10 p1.jpg를 실제 참조로 붙여 해당 칸만 토끼 아빠로 편집하도록 큐에 추가했다. 검수는 reviews.json에서 status=pass만 완료로 본다.

## 생성·검수 완료

최종 147장 모두 실제 이미지로 육안 검수하고 파일 SHA-256을 고정했다. 6장 보정 포함 총 153회 생성했다. coco 나무·twins 토끼 아빠 외에 mio 입술은 고양이의 자연스러운 입 선으로, pipo 목 방울의 띠는 무채색으로, pipo 수염은 실제 양 할아버지 참조로, lulu 꼬리는 당나귀의 가는 검은 꼬리와 끝 술로 보정했다. coco 잠자리는 잠자는 자리, nono 눈은 눈(snow), bruno 방울은 수액, mio 방울은 비눗방울로 본문 뜻을 유지했다.

최종 분할은 858종, 2,363개 책별 연결이다. 최대 500×500 WebP(확대 없음, quality 82), 파일 크기 중앙값 24,134바이트. lulu는 원본 가장자리 프레임 제거를 위해 12px, 나머지는 4px 안쪽으로 자른다. 원본·PNG·WebP·갤러리·운영 변경 전 백업은 `generated-images/changjak-words/`에 보존한다.

## 등록 구조와 보존 기준

운영 `/api/comic-assets/{series}-words`에 WebP 원본 바이트를 업로드하고, 각 운영 책의 누락된 `keyObjectImages`만 채운다. Editor2의 핵심단어 탭은 같은 책 데이터의 `objectName`으로 이 이미지를 읽는다. 저장 직전 최신 데이터를 다시 읽어 동시 수정을 감지하고 저장 직후 `keyObjectImages`/`updatedAt` 외 모든 필드를 깊은 비교한다. 기존 성공 이미지가 있으면 그대로 둔다. 업로드·등록·CDN 검증은 `registration.json`으로 재개한다.

별도 전역 어휘 DB 자동 추출에는 기존 `nameEn ?? name` 조건이 있어 이 500권의 빈 nameEn은 건너뛴다. 이번 범위는 운영 책 DB와 Editor2의 핵심단어 이미지 등록이며, 전역 어휘 DB 코드·영문 이름·본문 페이지는 변경하지 않는다.

브라우저 표본 검증: 운영 `/editor2/changjak-bruno-01`의 핵심단어 탭에서 5개 카드의 CDN URL과 실제 로딩(naturalWidth > 0)을 확인했고 화면도 육안 확인했다. 증거는 `review/editor2-bruno-01.png`. 브라우저에서는 생성·저장 버튼을 누르지 않았다. 전체 검증은 책 500권의 API 저장 전후 비교 및 카드 858종의 CDN 바이트 해시로 수행한다.

추가 브라우저 검증: 룰루 01권의 5개 카드와 피포 09권의 6개 카드가 로딩됐으며, 피포 09권 방울은 목 방울 카드와 다른 우유 방울 URL로 연결됐다. 이미 열린 편집기는 최신 데이터를 보려면 새로고침이 필요하다.

## 최종 결과

운영 500권 전부 등록 및 저장 전후 보존 검증 완료. 858종 카드와 2,363개 단어 항목 연결 완료. CDN에서 858종 전부 다시 내려받아 SHA-256이 최종 WebP와 일치함을 확인했다. [완료 manifest](20261003-changjak-word-images.json)에 카드 URL·해시·크기·책별 사용처, 147장 원본 검수/참조, 책별 등록 결과를 기록했다. 원본 생성물과 복구용 전체 책 백업은 로컬에 보존하며 Git에는 넣지 않는다.

검증: 실제 작업 폴더에서 `pnpm install --frozen-lockfile` 완료, MJS 4개 `node --check`·Python 2개 `py_compile`·`git diff --check` 통과. 생성된 이미지와 데이터 작업이므로 제품 전체 build/typecheck/test는 실행하지 않았다. 운영 데이터는 이미 반영됐으며 관련 스크립트·문서는 작업 브랜치에 로컬 커밋한다. 이번 작업의 main push는 요청되지 않았다.

2026-10-03 후속 사용자 요청: “메인에 푸시해줘”. fetch 후 origin/main은 4fcf3bb0이며 작업 커밋 c8f14f9b만 1개 앞서 있어 이번 작업과 인계 기록만 일반 fast-forward push로 통합한다. 기본 체크아웃의 영상 관리 브랜치 및 기존 미추적 output, 생성 원본/백업은 보존한다. 운영 DB 등록을 다시 실행하지 않는다.
