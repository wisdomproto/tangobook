# 탱고북 인쇄 판매용 한글·영어 활동지 디자인 탐색

- id: 20261012-strategy-print-worksheet-design
- domain: strategy
- status: integrated
- updated: 2026-10-12
- base: 28a1ad62c
- branch: main
- worktree: C:/project/tangobook
- integration: 시안 생성기와 기록을 로컬 main에 보존; 제품 코드 변경 없음
- delivery: 로컬 시안, 미푸시·미배포

## 요청과 완료 조건

사용자는 기존 활동지를 풍부하고 예쁘게 만들어 전용 한글·영어 학습지를 인쇄 판매하는 방향을 탐색한다. 스킬을 사용해 웹 참고 자료를 조사하고 디자인 예시 여러 개를 제작한다. 가격·판매 구성·출시 결정이나 운영 활동지 교체 요청은 아니다.

## 확인한 기준

PLATFORM.md, handoff README/MEMORY, 작업 지도, strategy/content/phonics BRIEF·MEMORY, 기존 인쇄 ko_phonics.html/en_phonics.html과 WorksheetPanel, 디자인 시스템 v2를 확인했다. 기존 워크지의 쓰기를 찾기·그림·붙이기 활동으로 확장하는 디자인 시안이다. 한글·영어의 교육 순서를 새로 확정하지 않는다.

## 결정과 진행

- 미감 비교를 위해 그림책형 / 오리기·붙이기 놀이형 / 정돈된 자연관찰 워크북형의 세 방향, 각 한글·영어 한 장을 제작한다. 유아~초등 입문 수준을 시안의 임시 대상으로 둔다.
- imagegen 및 pdf 스킬을 적용한다. 프로젝트 기본인 로컬 Qwen을 먼저 확인했으나 이 PC에 기록의 D 드라이브·ComfyUI 경로가 없으며 8188/8189/8190 리스너도 없다. 사용자에게 알린 뒤 imagegen 내장 도구로 새 삽화를 제작한다. 외부 작품의 그림이나 구성 복제 없이 구조·활동 원리만 참고한다.
- 글자는 이미지에 생성하지 않고 별도 조판한다. 인쇄 샘플은 A4 세로, 내부 여백, 흰 바탕, 컬러 삽화와 넓은 쓰기 공간을 사용한다.
- 참조: [Usborne 이야기와 파닉스 활동](https://usborne.com/us/very-first-reading-how-it-works), [KiwiCo Alphabet Play](https://www.kiwico.com/koala/abc), [Kumon 공식 샘플](https://kumonbooks.com/wp-content/uploads/2022/08/Bookstore-Packet-Pre-K.pdf). Usborne 활동 PDF는 웹 도구 용량 제한으로 열지 못했으며 본문 설명만 확인했다.

## 결과와 검증

- `output/worksheet-design-20261012/index.html`: 세 방향을 한글/영어 필터로 비교하는 갤러리. `sheets.html`: A4 원본 조판. `TangoBook-Worksheet-Design-Samples.pdf`: 6쪽 인쇄 샘플(약6.7MB). `previews/design-A.png`~`design-C.png`: 비교 이미지.
- `scripts/build-worksheet-design-samples-20261012.cjs`: 원본 삽화 atlas와 폰트를 사용한 로컬 생성기. `output/worksheet-design-20261012/assets/`에 새 삽화3장·기존 브랜드 로고·Story Hand 한/영 WOFF2를 보존했다. 전체 원문 프롬프트는 같은 폴더 `prompts.json`.
- 그림은 내장 image_gen 도구로 새로 생성했다. 외부 참고 그림을 복사하지 않았다. 한글·영어 공통 주제로 가/가방과 c/cat을 비교했으며 실제 단원 번호나 정식 커리큘럼 연결은 아직 아니다.
- A는 글자 결합·찾기·낱말·자유 그리기, 영어는 첫소리·쓰기·그림 선택. B는 오려 붙이기와 쓰기. C는 정돈된 반복 쓰기·찾기·그림 기록. 제안은 A 기본 시리즈 + B 놀이 활동이며 사용자 선택은 미정이다.
- Chromium 인쇄→Poppler PNG 렌더6쪽 전수 육안 검수. 한/영 제목6개를 공백 정규화 후 PDF 텍스트로 대조, 대체문자0개·A4 594.96×841.92pt 확인. HTML→PDF 변환 중 자체 손글씨 서체 제목의 글자 사이 공백이 늘어 추출됐으나 시각 렌더와 정규화 제목은 정확하다.
- 이미지 누락0, 하단 겹침0, 한/영 필터3장씩, 390px 갤러리 가로 넘침0. B 한글 오릴 원90px/붙일 원90px, B 영어 오릴 카드158×174px/붙일 칸158×174px로 수정·재검수했다. 초기 atlas 고양이 귀가 셀 경계에 잘려 crop 배치를 보정했다.
- `node --check scripts/build-worksheet-design-samples-20261012.cjs` 통과. 제품 코드는 바꾸지 않았으므로 제품 전체 typecheck/test/build는 실행하지 않았다. 실물 인쇄·유아 사용성·필순/교육과정 전수 검수는 수행하지 않았다.
- 정적 파일 전용 Python 서버 `http://127.0.0.1:5196/`로 갤러리를 열었다. 제품 서버·예약 발행기를 실행하지 않는다. PDF와 갤러리 탭 열기는 앱 도구에서 queued로 반환됐다.

## 보존

생성기·작업 기록·공유 기억은 관련 파일만 이름으로 stage해 로컬 커밋한다. 비교 HTML/PDF/PNG와 입력 삽화·폰트·검증 JSON은 위 output 폴더에 로컬 보존한다. 기존 소개서 PDF·UI output·tmp 등 다른 미추적 파일을 건드리지 않았다. 새 판매 구성이 승인되지 않았으므로 PLATFORM.md의 확정 상품·가격은 변경하지 않는다. 이번 작업 push/배포는 요청받지 않았다.

## 다음 행동

세 방향을 비교하고 사용자 선택 후 실제 과정의 단원과 보유 동화·캐릭터를 연결해 시리즈 템플릿을 확정한다. 판매 상품 방향이 승인되면 PLATFORM.md/STRATEGY.md에 반영한다.

## 사용자 반증과 2차 시안 — 2026-10-12

- 사용자는 오리기 활동을 제외하도록 지시했다. 앞으로 이 학습지의 활동 구성에서 오리기·오려 붙이기를 제안하지 않는다.
- 기존 삽화가 올드하다고 지적했다. 부드러운 수채화·색연필 그림책 방향은 승인된 그림체가 아니다. 질감이 없는 또렷한 그래픽과 현대적인 간결한 입체 삽화로 재탐색한다.
- ‘가’ 학습에 ‘토끼의 작은 텃밭’을 앞세운 주제 불일치를 지적했다. 제목·대표 그림·낱말·활동은 가→가방, c→cat처럼 학습 대상에 직접 연결한다. 장식용 이야기·동물을 대표 소재로 끼워 넣지 않는다.
- 1차 A 기본+B 놀이 추천은 이 반증으로 폐기한다. 새 시안은 읽기·찾기·쓰기 중심이며, 그림체와 구성은 사용자 선택 전이다.
- 내장 image_gen으로 새 atlas2장(그래픽형/매끈한 입체형)을 생성했다. 실제 결과의 그래픽형은 약한 그라데이션이 남았지만 수채화·색연필·콜라주 질감은 없다. 새 제목은 ‘가를 배워요’ / ‘Let’s learn c’, 대표 사물은 가방/cat이다.
- 구성: 따라 쓰기→첫글자에 맞는 그림 고르기→빈칸 가+방 / cat 쓰기. 한글 선택지는 가방·나비·모자, 영어는 cat·cup·hat. 선택지와 대표 그림이 학습 글자와 직접 연결되며 오리기·붙이기·관련 없는 정원 이야기 없음.
- 생성기 `scripts/build-worksheet-design-v2-20261012.cjs`, 로컬 결과 `output/worksheet-design-20261012/v2/`, 갤러리 `http://127.0.0.1:5196/v2/`. 원문 프롬프트는 v2/prompts.json. 기존 1차 시안은 이력으로 보존한다.
- A4 PDF4쪽과 비교 PNG2장 제작. Poppler 최종4쪽 육안검수, 제목4개·대체문자0·제외활동 문구0·A4크기, 이미지 누락0·하단겹침0·390px넘침0 확인. 모자 atlas 셀 아래에 다음 행의 초록색이 살짝 보여 inset clip으로 제거 후 재검수했다. 실물인쇄 미확인.
