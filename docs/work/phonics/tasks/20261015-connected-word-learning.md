# 한영 같은 타깃 낱말 배우기 연결

- id: 20261015-connected-word-learning
- domain: phonics
- status: active
- updated: 2026-10-15
- base: da941bcb8
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청과 구현 범위

사용자가 이전 설계의 한영 적용을 승인했다. 같은 타깃 낱말을 낱말 만나기(그림·글자 눌러 발음, 준비된 연결 동화 장면)→블록→쓰기→색칠로 연결하고, 연습 완료와 정답/힌트 없이 해결한 근거를 구분한다. 외부 자산 생성·운영 데이터 변경·자동 난이도/홈 랜덤 구현·push는 이번 요청에 포함하지 않는다.

## 결정과 진행

- 기존 낱말 탐색/동화 장면·블록·쓰기·ColoringPlayer를 재사용한다. 여러 독립 게임의 랜덤 추출 대신 한 낱말 묶음의 대상·단계 진도를 보존한다.
- 첫 학습은 순차 진행, 완료 활동 재학습/자유 선택·기존 URL/개별 게임·진도는 보존한다. 새 통합 활동을 추가하고 자유모드의 중복 낱말 게임 항목은 정리한다.
- 한글 모음 입문/복습에는 무리한 낱말 과제를 추가하지 않는다. 영어 Book1은 블록 없이 첫 글자 쓰기와 낱말 뜻 연결을 유지한다.
- 완료한 과거 챕터를 새 활동 때문에 다시 잠그거나 새 활동을 했다는 가짜 기록을 만들지 않는다. 새 경로 적용 시 기존 완료 챕터 면제 목록을 자녀/언어별로 보존하고, 새 연습은 자유모드에서 가능하게 한다.
- 실제 타깃/그림/색칠 준비 상태·배운 블록 조각 조건을 확인하며, 자산 부족/오류를 완료로 만들지 않는다.

## 검증

진행 중. 대상 고정/단계 재진입·자녀/언어 격리·기존 진도 호환·근거 구분·한영 계획/라우트·색칠 연결 회귀와 실제 대표 화면을 확인한다.

## 사용자 후속 — ㅇ 연결·영어 타깃 난이도

- 모음 입문에서 초성 ㅇ을 자연스럽게 만나게 하고 이후 아기/야구 블록에 사용한다. 초성의 묵음과 받침 ㅇ 소리는 구분하며, 모음 쓰기는 모음 자체를 유지한다. 다른 플랫폼의 실제 제시 방식은 추가 확인 중이다.
- dragon을 파닉스 타깃에서 제외하라는 사용자 반증. 기존 영어4권 en-b4-u04 dr/pr/tr의 sampleWords와 공개 책의 targetWords에 이미 존재했다. Git blame은 2026-02-27 dbd74f19f2부터이며 선정 사유 문서는 확인하지 못했다. 이번 작업에서 이를 무비판적으로 drag/on 시각 조각으로 수용하려 한 방향을 철회한다.
- shared 예시에서 제외하고 오래된 공개 source의 config/family/flashcard와 복습 대표어에서도 학습용으로 제외한다. 공개 R2 원본·동화 dragon 내용·자산은 삭제하지 않는다. 같은 dr 패턴의 dress/drive/drum이 남으므로 새 삽화/음원 없이 과제를 유지한다.
- 단어 길이만으로 다른 단어를 일괄 삭제하지 않는다. 배운 grapheme/phoneme로 해독 가능한지와 단원 목표를 전권 검토한다. Oxford ELS 공식 안내는 배운 소리와 맞는 decodable 책을 사용하며 초기예시어와 독립해독 타깃을 구분한다: https://home.oxfordowl.co.uk/reading/reading-schemes-oxford-levels/essential-letters-and-sounds/ . 영국 DfE SSP 기준도 누적 GPC와 읽기 자료의 정합성을 요구한다: https://www.gov.uk/government/publications/phonics-teaching-materials-core-criteria-and-self-assessment/validation-of-systematic-synthetic-phonics-programmes-supporting-documentation . 특정 단어의 제거는 사용자 결정이며 이 출처들이 dragon 자체를 금지한 것은 아니다.

## 2026-10-15 현재 구현 체크포인트 — 별도 타깃 수정과 분리

- dragon 제외 수정은 11324f039 독립 커밋이다. 학습 연결 전체를 완료한 커밋으로 해석하지 않는다. 관련 tasks/20261015-english-dragon-target.md와 main 포함 여부를 실제 Git으로 대조한다.
- 이 작업 폴더의 나머지 변경은 진행 중이다. 새 word-learning 활동, 낱말별 meet→block→write→color 저장/자녀·언어 격리, 기존 완료 챕터 면제 snapshot, 모델 지원 연습/독립 근거 분리, 기본 모음3번째 탭의 묵음ㅇ 연결, 배운 초성ㅇ/받침ㅇ 분리, 수동 rime-first UI 구현.
- 기본 모음 쓰기는 모음 자체다. 앞의ㅇ은 소리가 없다는 설명만 하고 ㅇ 단독 발음을 만들지 않는다. 국립국어원 온라인가나다 근거: https://m.korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=216&pageIndex=1&qna_seq=318450 . 토도한글 공개 소개/FAQ/가이드는 확인했지만 ㅇ의 구체적 도입 시점까지 확인하지 못했으므로 동일 방식이라고 주장하지 않는다.
- 영어: cat a+t→at/c+at→cat, ship i+p→ip/sh+ip→ship, 묵음e를 별도 발음하지 않음. 녹음 없는 중간 조각은 단계에서 빼고 whole-word를 유지한다. 영어 Book1은 첫 글자·뜻 소개/첫 글자 쓰기이며 블록 없음. 여러 음절 타깃은 임의 음소 음원을 만들지 않고 시각 조각+전체 발음만 사용하나 콘텐츠 적합성 재검토 필요.
- 마지막 단어는 plain 발음으로 끝낸다. 영어 Book2+의 저작 c-a-t 녹음을 재사용해 방금 수행한 블렌딩을 중복하지 않는다. 음원 실패는 재시도이며 다음/완료를 만들지 않는다.
- 70 source/512타깃 공개 read-only 점검: 그림 누락0, full coloring 또는 실제 기존 mask fallback 존재. dragon 제외 후511. pin(en-b2-u04)은 full outline 없어 실제 mask 색칠 fallback이다. 운영 데이터·자산 변경 없음.
- **남은 핵심:** ㅇ을 입문에서 제공해도 도마(kr-h1-u04)/사자(u08)/우주(u09)/하트(u13)는 다른 선행 자음이 부족하다. 현재 프로토타입은 block 가능 낱말을 먼저 배치하고 이4개는 블록 단계를 생략한다. 사용자 요구인 같은 타깃의 전 단계 연습을 전권 충족했다고 보고하면 안 된다. 타깃 교체/선행 단계의 콘텐츠 정책을 해결한 뒤 학습 연결 전체를 main에 합친다. 임의 미래 자음 전체 unlock이나 가짜 블록 완료를 만들지 않는다.
- **남은 검수:** 실제 플레이어 블록→쓰기→색칠 완료 연쇄(현재 부모 orchestration mock 회귀만 완주), 다른 난도/모든 대상 UI 전수, 실제 장치·부모/아이 관찰. 새 연결은 아직 main 미포함.

### 검사와 실제 화면

- client typecheck 통과. 관련 phonics 전체+기록/색칠hook 47파일376검사 통과 후 audio part failure 테스트 추가와 자연 whole-word 음원 보완: WordMeeting3검사 추가 실행 통과. 당시 lint 오류0/기존 KoreanBlock unused2경고. client build18.85초 통과는 마지막 audio/legacy 보완 전 결과이며 최신 전체 build를 완료했다고 보고하지 않는다.
- 위 전체 검사를 넓혔을 때13실패: 통합 메뉴/색칠 역할 변경 기대값 수정, 빈 migration snapshot을 완료 기록으로 오해하지 않도록 저장 검증 분리, fresh session test는 새 완료 전에 snapshot 초기화. 실제 legacy vowel source kr-h1-u01에 잘못 word-learning을 추가하던 코드는 제외로 수정했다. 이후47파일376검사 통과.
- localhost5187는 이 worktree Vite, API_TARGET=https://www.tangobook.co.kr 공개 API read-only·DISABLE_PUBLISH_SCHEDULER=1. 서버 backend는 새로 띄우지 않았다. 이전5186 worktree는 보존.
- 실제 PC1280×720, 태블릿1024×768, 가로폰812×375 새 만나기 화면 배치/가로넘침0 확인. K 모음 실제3클릭 후 ㅏ→아와 소리없는ㅇ 설명 확인. K 낱말 아기에는 이제 block 단계가 표시된다. 영어 bat 첫 수동 합치기 버튼/레이아웃 확인. 3개 이상의 여러 단계 끝까지 플레이한 증거는 아직 없음.
- output/connected-word-learning-20261015에 dr-targets/vowel-carrier/korean-tablet PNG. source 캐시는 tmp/connected-word-books.json, 점검 스크립트 audit-filtered-targets.mts. 커밋에 공개 source 대용량 캐시·개인 로그·env를 포함하지 않는다.
