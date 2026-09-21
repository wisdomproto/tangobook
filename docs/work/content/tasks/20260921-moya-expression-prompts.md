# 모야 전체 표정 프롬프트 수정

- id: 20260921-content-moya-expression-prompts
- domain: content
- status: integrated
- updated: 2026-09-21
- branch: main
- worktree: C:/projects/tangobook
- delivery: 로컬 main 반영. push·이미지 생성·운영 데이터 수정 없음.

## 사용자 결정

[등록 이미지 진단](20260921-moya-expression-audit.md) 후 사용자가 “프롬프트 다 수정해줘”라고 요청했다. 대상은 모야 시리즈 전체이며 20~25권의 미생성 장면도 포함한다. 수채화와 캐릭터 정체성은 유지하고 표정 고정 제약을 푼다.

## 반영

- `docs/art-direction/moya-anchor.md`: 눈 고정·목으로만 감정 표현·입 선 금지를 제거. 눈꺼풀/시선/입꼬리/턱의 긴장/귀 각도 변화와 감정별 연기를 지정. 캐릭터 참조는 외형 기준이며 중립 표정을 복제하는 기준이 아님을 명시. 그림체의 선/물감 분업에 짧은 입 선 예외도 명시.
- 같은 문서의 단체 시트 지침: 눈을 지운 목선 검사 대신 같은 외형으로 호기심·거부·두려움·울먹임·안도·기쁨을 구분하는 표정 시트로 변경.
- `_SERIES-ANCHORS.md`와 `moya/_design.md`의 눈 고정 지시도 함께 수정.
- `moya/_scenes.json`: 25권 250컷에 본문 감정에 따른 눈/입/귀/자세 지시 추가. 11권 p4, 13권 p4 등은 개별 지시로 두려움/울먹임을 구체화. 서로 다른 역할의 인물은 같은 표정을 복사하지 않으며, 풍경/뒷모습/발굽/이마 클로즈업은 기존 구도를 지킨다. 기존 SCENE 세 곳의 눈 고정 문장도 제거.
- 빌더로 `moya-core.js`, `moya-plan.html`, `moya-01.html`~`moya-25.html` 재생성. 개별 시트 복사 5종과 각 쪽/일괄 복사에 현행 앵커가 전달된다.

## 검증과 한계

- `build-series-html.mjs moya`: 25권 250컷. 기존 등장 없음 1컷은 밤하늘/잠든 무리 원경(06권 p9)이며 새 인물을 넣지 않았다.
- Node VM에서 250컷 모두 생성 HTML과 일치, 수정 전후 고정 캐스트 등장 판정 동일 확인. 5종 시트 프롬프트와 실제 `composeBatchPrompt` 결과에서 새 앵커/표정 지시와 `@image1` 참조 확인. 기획서에도 이전 영문 눈 고정 금지 지시가 없음.
- `node --check packages/client/public/moya-core.js`, `sync-anchor-to-core.mjs moya --check`, `git diff --check` 통과.
- 기존 생성 HTML이 원본보다 오래되어 재생성 시 이미 원본에 있던 수정도 동기화됨. 예: 24권 p1~2의 낯선 물가가 이사가 아니라 큰비 뒤 달라진 물가라는 원고. 이번에 본문 원고 파일은 수정하지 않았다.
- 새 그림을 생성하지 않았으므로 실제 개선 효과는 미검증이다. 기존 업로드 이미지도 그대로다. 다음 생성은 캐릭터 이미지 파일을 실제로 첨부하고 11권 p4·13권 p4 등의 전후 표정을 비교한다.
