# 간단 제안서 자산·검수 · 2026-10-10

## 최신 제품 이미지 교체

추가 수정: 한글 제품 이미지3장은 글자를 키우고 모음의 라벨 내부 여백을 확보한 `*-v2.png`가 최신이다. Blender 참조는 `*-ko-v2.png`, 영문은 기존 `*-en-v1.png` 유지. 2~5장 기본 폭 이미지·넘침 확인 후 캡처 갱신.

실제 CAD → Blender → imagegen으로 한글 가구/영어 CAT 각각 3장 제작. 본편 2~5장은 새 제품 이미지와 가구 쓰기 도해 사용. 5장은 언어 선택으로 한 흐름씩 표시. `tree-*`와 `hardware-premium-concept.png`는 이전 자산으로 보존하며 최신 본편에서 제외했다. 자세한 출처·프롬프트·재생성은 [제작 기록](blender/image-prompts.md). 영어 최종 캡처 `hardware-solution-english-preview.png`. 아래 항목은 교체 전 이력을 포함한다.


- `tree-block-concept.svg`, `tree-writing-concept.svg`: ‘나무’ 하나를 실물 블록 조합·쓰기 교구로 설명하는 새 벡터 도해. 양산 사진·입력 인식 완료 증거가 아니다.
- `digital-hidden-object-actual.png`: [거인의 정원 공개 숨은그림 찾기](https://www.tangobook.co.kr/activity/hidden-object/ho-0007-%EA%B1%B0%EC%9D%B8%EC%9D%98-%EC%A0%95%EC%9B%90)의 실제 시작 화면. 확대 버튼 사용, 완료 진행 없음. 실제 활동 존재의 증거이며 아동 성과·교구 연동 증거가 아니다.
- `hardware-premium-concept.png`: 기존 제품 방향 AI 시안 재사용. 원래 생성 기록은 `premium-image-sources.md`. 이번 수정에서 새 AI 이미지 생성 없음.
- 책 표지와 나무 어휘는 기존 실제 자산. 최종 HTML은 이미지를 내장하며 새 외부 자산 업로드 없음.
- 국내 시장 출처: [육아정책연구소 2025-04-25 자료집](https://repo.kicce.re.kr/bitstream/2019.oak/5833/2/SP2501.pdf)의 교육부 시험조사 인용. 글로벌은 [Technavio 공식 보고서](https://www.technavio.com/report/early-childhood-education-market-industry-analysis). 기간·범위가 다른 수치이며 직접 비교·합산·교구 TAM 전용 금지.
- 기술 근거: `packages/client/src/features/games/hooks/useBoardCamera.ts`, `docs/handoff/board-camera.md`. 카메라 코드 기반과 실기기 인식 검증을 구분한다. 쓰기 연동·양산 사양·학습 효과·가격은 미확정.

## 최종 캡처 대응

| 장 | 파일 |
|---|---|
| 1 시장 | education-market-preview.png |
| 2 두 방식 | parent-purchase-preview.png |
| 3 플랫폼 | investor-preview.png |
| 4 교구 | hardware-sales-preview.png |
| 5 연결 경험 | hardware-solution-preview.png |
| 6 확장 콘텐츠 | content-foundation-preview.png |
| 7 기술 | execution-proof-preview.png |
| 8 BM | acquisition-example-preview.png |
| 9 마일스톤 | investment-roadmap-preview.png |
| 10 투자 | investment-thesis-preview.png |

이름이 이전 장 주제와 다른 캡처도 위 대응이 최신이다. 그 외 preview는 과거 참고다. 최종 390px·1280px 각 10장, 기본 887px 10장의 가로 넘침·이미지 상태와 대표 배치 확인. 내부 팀 탭도 로드 확인. PDF/인쇄·실기기·학습 효과 검증은 수행하지 않았다.

## 재독 후 보강 자산 (2026-10-10)

- `furniture-writing-use-v1.png`: 일반 종이에 ‘가구’를 따라 쓰는 활동 예시. `blender/writing-activity-scene.png` 구도→내장 imagegen. 실제 탱고 노트의 외형·입력 장치 증거가 아니다. 전체 프롬프트와 참조는 `blender/image-prompts.md`.
- 6장 `giant-page-1.webp`는 기존 거인의 정원 본문 삽화(리더 UI 캡처 아님), `digital-hidden-object-actual.png`는 같은 책의 실제 공개 활동 화면. 교구 연동 완료를 뜻하지 않는다. 표지는 보유 콘텐츠 보조 예시로 축소.
- 4장 쓰기 SVG는 원본 보존하되 본편에서는 새 활동 예시로 교체. 5장 기존 한글v2/영어v1 이미지는 CSS로 제품 비중만 확대. 새로운 하드웨어 생성/교체 없음.
- 최신 preview10장과 영어5장 갱신. 390/1280px 각각10장 가로 넘침0·이미지 깨짐0, 기본폭 전체 육안/한영전환/내부팀 탭 확인. 인쇄·실기기 검증 없음.

## 문제·해결 비교 정정

2장 `analog-blocks-standalone-v1.png`는 화면·보드가 없는 독립 블록 활동 설명 예시다. 실제 CAD 메시로 Blender 구도를 만든 뒤 내장 imagegen으로 마감했다. 특정 경쟁사 실물 사진이 아니다. 생성기 `build-analog-example-20261010.py`, 장면 `blender/analog-blocks-scene.png`,프롬프트 `blender/image-prompts.md`. 연동 제품 사진은3~5장에서 유지한다.5장의 질문·칭찬·재도전 문구와 블록 칩은 문서용 이용 흐름 예시이며 현재 앱의 정확한 화면/음성 캡처가 아니다.
## 최신 자모 시각 자료 · 2026-10-10

한글 제품 사진은 hardware-kit-studio-v3.png / hardware-block-detail-v3.png / hardware-feedback-use-v3.png, 독립 블록 비교는 analog-blocks-standalone-v2.png가 최신이다. 원본 출력 스티커 PDF의 ㄱ·ㅏ를 Blender 텍스처에 적용했고 ㅜ는 같은ㅏ의90도 회전이다. 작은 자모 예시도 같은 PNG 원본. 이전 버전은 비교용 보존. 최종 사진의 정밀 치수 보장을 뜻하지 않는다. 2~5장 캡처/한영전환 갱신, 390/1280px 연결 장표 가로 넘침·깨진 이미지0 확인.
## 미션·읽기 확장·인식 원리 도해 보강

5장 진행 표시는 문서 HTML/CSS로 만든 화면 구성 예시이며 실제 제품 캡처가 아니다. 6장의 거인의 정원은 읽기 확장 단계 예시이며 ‘가구’와 해당 책의 직접 어휘 연결을 주장하지 않는다. 7장은 기존 hardware-kit-studio-v3.png에 HTML 번호를 얹어 부품 역할을 설명한다. 사진 수정/신규 생성은 없고 기술 항목·검증 상태를 함께 표시한다. 3~8장 변경 미리보기 갱신. 390/1280px 각각10장 넘침·깨짐0,모바일5~7장 육안 확인.

## 간단본 중복·부록 축약

5장의 반복 문장과 별도 다음 미션 단계를 덜고 안내·조합·반응 및 진행 예시로 정리했다. 진행 예시는 오른쪽 설명 아래에 배치하며 실제 앱 캡처를 뜻하지 않는다. 8장의 두 미완결 제목을 완성했다. 투자자 부록은 현재 본문 출처만 접어서 유지하며, 이전 전체 부록과 언어학습 상세는 내부 팀 탭에 원문 보존한다. 신규 이미지 생성 없음. 한글/영어5장·8장 미리보기 갱신, 390/1280px 수정 장표와 내부 팀 부록 펼침 확인. 이전 부록 보존 문자열 일치 및 중복ID0 확인. 인쇄·실기기 검증 없음.

## 1장·6장 실제 화면 교체 · 2026-10-10

- 1장 기존 시장 수치·출처 유지, 대표 규모 두 카드로 단순화. 참여율/월평균은 내부팀 기존 상세에 보존. 새로운 시장조사·연간 환산 없음.
- giant-reader-actual.png: https://www.tangobook.co.kr/viewer/1789350946382?lang=ko&style=style-1778405374347&autoplay=0 의 실제 한국어 수채동화풍 첫 본문. 스스로 책읽기760×540 전체 화면 캡처. 문장 합성/이미지 생성 없음, 음성 재생 검증 아님.
- giant-reading-activity-actual.png: https://www.tangobook.co.kr/activity/hidden-object/ho-0008-거인의-정원 의 크게 하기760×760 전체 화면. 동일 책·수채동화풍, 정답0 시작 상태. 그림·낱말·진행 표시·하단 문구가 잘리지 않게 최종 저장. 이전 ho-0007 캡처는2장과 참고용으로 보존.
- education-market-preview.png / content-foundation-preview.png 최신 화면 갱신. 기본폭·390/1280px 수정2장 육안 및 가로 넘침0, 투자자 이미지 깨짐0. PDF/인쇄 미검증.
