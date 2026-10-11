# 실제 근거 이미지 · 2026-10-10

- `playtango-hardware-ir-extract.png`: 사용자가 제공한 `C:/Users/kil21/Downloads/플레이탱고 IR.pdf` 11쪽 중앙 실물 교구와 화면 이미지. PDF clip 렌더로 추출, 새 사진 생성이나 제품 수정 없음. 2024.01 과거 제품 자료이며 현재 탱고북 사양이 아니다.
- `language-block-game-actual.png`: 내장 브라우저에서 `https://www.tangobook.co.kr/library/phonics/korean/kr-h1-u07/game-korean-block` 2026-10-10 캡처. 나비 미션·0/4·조각 배치판·확인/다음/초기화/실물블록 버튼을 실제 DOM과 화면에서 확인. 플레이 완료·인식 정확도·학습 효과 테스트는 아니다. 운영 데이터 생성/콘텐츠 수정 없음.
- `report-phonics-sample.webp`: 기존 strategy-20261005 자산과 report-capture-sources.json. 실제 제품의 테스트 데이터 화면이며 고객 실적이 아니다.
- `series-changjak-mina-01.webp`: 기존 창작 자산. 50권500장은 2026년9월 삽화 제작·검수·등록 기록이며 공개 수/학습 효과/판매 수가 아니다.
- `activity-kr-hunt.svg`: 학습 미션 설명 도해, 실제 화면 캡처가 아니다.
- `screen-block-use-concept.png`: 앞서 생성한 AI 연동 경험 시안. 별도 source 문서의 프롬프트 참조.

## 2026-10-11 · 보유 콘텐츠와 AI 저작도구

- story-listening-actual.png / object-scene-actual.png / page-order-actual.png: https://www.tangobook.co.kr/vocabulary/book-1789350946382?lang=ko 의 동화 내용 놀이에서 각 게임 진입. Chrome1000×740 실제 화면, 정답 제출/활동완료 없이 시작 상태 캡처. object-scene은 준비화면에서 바로 시작 후 모든 이미지 로드를 확인. 이미지 합성/편집 없음. 숨은그림은 기존 giant-reading-activity-actual.png. 같은 작품이지만 활동별 그림체가 다름. 음성 재생·학습효과 검증 아님.
- 동화책 표지와 창작 시리즈 본문: ../strategy-20261005/content-showcase-sources.json 기준. 공개/비공개 구분 보존, 전체 수량을 현재 공개권수로 주장하지 않음.
- authoring-giant-page.webp: 기존 giant-page-1.webp의 원본 URL https://assets.tangobook.co.kr/1772084667220-거인의정원-illustration-page1-1779432689547.webp 에서 읽기 전용 다운로드.
- 저작도구 그림: business-plan-content-20261011.cjs + 디자인시스템CSS의 문서용 HTML 구성 예시. 실제 보유 삽화와 새 예시 원고를 배치했으며 실제 편집기 캡처가 아님. 이야기/삽화/음성/번역/검수/활동구성 기능의 관계를 보여주며 화면버튼은 문서 표현.
- 기술 근거: server services의 storybook/tts/translation/game, client features의 illustration/tts/translation 및 vocabulary-unit의 derive-storybook-unit/game-data-adapter. 비용 절감은 자동화·재활용 구조의 사업 논리이며 실측 절감률은 미제시.

### 확장성2장 · 최종 블록 묶음과 보유 학습만화

- expansion-numbers/creative/puzzle-blocks.webp: 기존 CAD → Blender → 내장 imagegen → 사용자 지시로 보드 제거·블록 묶음화. 최종3종 모두 인식판 없음. 숫자0~9/연산,색·도형,길·연결 조각을 설명하는 제품 콘셉트. 기존-board concept.png는 수정 참조로 보존, 본편에서는 사용하지 않음. 상세 프롬프트/생성파일/최종경로: expansion-image-prompts.json. WebP는 원본 크기 그대로 quality92 인코딩만 수행. 양산 사양·수량·호환성 보장 아님.
- Blender 재현: ../../drafts/build-expansion-scenes-20261011.py; 참조 렌더는 blender/expansion-*-scene.png, 원본 board-geometry.json 재사용. .blend와 메시 중간파일은 기존 로컬 자산 정책에 따라 비추적.
- tico-ep01-p7.png: https://www.tangobook.co.kr/api/comic-assets/learning-comic-ep01 의 p7 → https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/comic-assets/learning-comic-ep01/p7.png. 실제 보유 삽화, 완성 공개 학습만화 UI 캡처가 아님.
- 확장 창작동화3개는 기존 series-changjak-mei/pipo/twins-01.webp. 신규 외부 작품 표지/경쟁사 상품사진 사용 없음. 보드게임 원칙은 사용자 지정 과거 대화 「Set 게임 설명」의 SmartGames 비교 검토에서 확인, 구체 문제·문제수·제품 복제 주장 없음.

### 2026-10-11 파닉스 소개 장표
- `phonics-gagu-word.webp`: 공개 GET `/api/storybooks/kr-h1-u02` flashcards 가구 카드. 원본 https://assets.tangobook.co.kr/phonics-word-cards/kr-h1-u02-gagu-18fdf742-w800.webp (이미지 변형 없음).
- 영어 cat은 기존 `../strategy-20261005/word-en-b2-u01-5.webp` 재사용. 해당 폴더 `content-showcase-sources.json` 원본 URL 기록.
- 단계·권수는 `packages/shared/src/constants/index.ts`의 KOREAN_PHONICS_CURRICULUM / ENGLISH_PHONICS_CURRICULUM 기준. HTML 배치는 실제 앱 캡처가 아닌 학습 내용 예시.

### 2026-10-11 탱고 파닉스 권별 표지
`phonics-covers/sources.json`에 9권의 실제 삽화 출처를 기록. 기존 삽화를 변경하지 않고 HTML/CSS로 별도 제목·권번호·색을 디자인했다. `covers.html`은 편집 가능한 내장 원본, `*-cover.webp`는900×1200 출력. 전용 Story Hand Global0.4.0 글자 지원 확인. 재생성: `node docs/marketing/drafts/build-phonics-covers-20261011.cjs --render`. 이 작업은 제안서용 표지이며 운영 책 표지를 교체하지 않았다.

### 2026-10-11 표지 최종 교체 · imagegen-v2
사용자 정정: 낱말 삽화 제외, image skill로 제작. `phonics-covers/*-imagegen-v2.webp`9종이 현재 사용본이며, 이전 낱말삽화+HTML 표지는 이력이다. 내장 imagegen이 타이포/배경을 함께 생성했고 별도 글꼴 로딩이나 픽셀 보정 없음. 원본PNG경로·요청별 프롬프트·참조는 `phonics-covers/imagegen-v2-prompts.json`. WebP 인코딩만 수행했으며 각1086×1448.

## 2026-10-11 파닉스 권별 구성 카드

`phonics-covers/*-chapter-v3.webp`9종: 내장 imagegen 신규 생성. `chapter-v3-prompts.json`에 최종 프롬프트/생성 원본 경로/공통 스타일 참조 기록. 실제 교재 표지·앱 캡처가 아닌 보유 커리큘럼의 보조 문자 예시이며, 제목은 HTML 텍스트로 별도 표시. 소중한글 공식 books/first-book의 시리즈 구성 및 단계 설명 방식만 참고, 이미지/캐릭터 복제 없음. 이전 `*-imagegen-v2.webp`는 이력 보존.
