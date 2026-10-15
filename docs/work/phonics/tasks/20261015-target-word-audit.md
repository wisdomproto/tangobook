# 한영 타깃 낱말과 예외 처리

- id: 20261015-target-word-audit
- domain: phonics
- status: integrated
- updated: 2026-10-15
- base: 9ffee55e6
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 로컬 main 873d1f808 fast-forward 통합
- delivery: 미푸시·미배포

## 최종 사용자 결정

- 영어: “아..그럼 냅두자” → “냅두고 예외처리해서 구현하자”. 앞선 단음절 제한/일괄 교체는 취소하고 원래 e-future 기반 타깃을 유지한다. 영어에는 누적 선행 GPC 제한도 적용하지 않는다. dragon 제외11324f039도 되돌린다.
- 한글: “헐..그럴리가. 한글에서는 규칙을 지켜야해.” **영어 예외를 확대하지 않는다.** 안 배운 초성/모음/받침을 미리 제공하거나 블록 단계를 생략하지 않는다. 모음에서 만나는 묵음 초성ㅇ은 받침ㅇ을 배웠다는 뜻이 아니다.
- R2/DB 원본/동화 내용·그림은 수정하지 않는다. 한글 학습 투영과 중앙 누적 범위로 오래된 공개 source에도 동일 규칙을 적용한다. 현재 push/배포 요청 없음.

## 근거와 이전 추정 정정

기존 분석 docs/phonics-english/efl-phonics-analysis.md는2026-07-26 작성이다. 원 스캔 경로 phonics/english는 현재 checkout에 없다. 원교재 공개 미리보기 첫 페이지에 drum/dress/**dragon**/drive, 다음 페이지에 cherry/whisper가 실제 기재되어 있다. dragon이 탱고북에 잘못 유입됐다는 추정은 철회한다. 출처가 모든 현재 단어/판본과 완전히 일치함을 검증한 것은 아니다.

- 원교재 미리보기: https://www.englishbooks.com.tw/ef/EFL%20PHONICS%204.pdf
- 원교재 답지: https://www.englishbooks.com.tw/%2ANEW/Phonics/EFLPhonics_New/Download/New%20EFL%20Phonics%20Book%204%20AK.pdf

## 한글 전수 대조

학습 권 순서와 초성/모음/종성의 누적 목록을 분리한다. getKoreanLearnedLetters/isKoreanWordInScope가 공통 기준이다. 원 저작 sampleWords와 그림은 보존하고 학습 curriculum에서 조건에 맞는 낱말만 투영한다. 같은 필터를 공개 책의 config/family/flashcard·복습 후보에도 적용한다.

| 단원 | 해당 단원 학습 타깃에서 제외 | 아직 안 배운 요소 |
|---|---|---|
| ㄷ kr-h1-u04 | 도마 | 초성ㅁ |
| ㅅ kr-h1-u08 | 사자 | 초성ㅈ |
| ㅇ kr-h1-u09 | 우주 | 초성ㅈ |
| ㅌ kr-h1-u13 | 하트 | 초성ㅎ |
| ㅃ kr-h3-u03 | 빨래 | 모음ㅐ |
| ㅆ kr-h3-u04 | 새싹·썰매 | 모음ㅐ |

복잡한 모음 u02의ㅖ·ㅚ 표기는 실제 타깃 계란/예절/시계/얘기에 맞게 **ㅒ·ㅖ**, u03의ㅟ·ㅢ는 참외/열쇠/생쥐/가위에 맞게 **ㅚ·ㅟ**로 수정했다. ㅢ는 기존u05에서 배운다. 쌍자음과 복잡한 모음은 기본 조각으로 구성할 수 있어도 해당 글자를 배우기 전에는 낱말 타깃에 허용하지 않는다.

원본70권512타깃 중 한글124→117, 전체505타깃. 한글 모든 유지 타깃에 대해 현재까지 배운 초성/모음/받침만으로 블록 구성 가능, 누락된 타깃/블록 불가능0. 적합 단어가2개인ㅆ단원은 듣고 고르기를 실제2보기로 제공하며 필수 경로를 막지 않는다. 선택 그림짝은3개 미만일 때 숨긴다. 다른 단원 단어를 가져와 숫자를 채우지 않는다.

## 영어 구현

- cat: a+t→at / c+at→cat. ship: i+p→ip / sh+ip→ship. 매직e는 짧은 rime→긴 rime 비교이며 e 단독 발음을 만들지 않는다.
- 다음절/철자 예외22개는 전체 낱말 녹음(mod_english 우선)+그림·뜻으로 만나며 dr+agon 같은 가짜 발음을 만들지 않는다. 실제 부분 음원이 없을 때도 자연 전체 발음 예시로 전환한다. 기존 word-family 듣기/쓰기에도 같은 예외 규칙을 적용한다.
- 영어 Book1은 첫 글자의 낱말 예시이며 전체 해독/블록을 요구하지 않는다. Book2+ 연결 블록은 최장8글자 elephant까지 같은 타깃으로 구성한다. 기존 단독 블록의6글자 표집은 보존한다. 실물8글자 인식의 실기기 검증은 별개다.
- 원음 실패는 재시도한다. 소리 없이 낱말 만나기 완료를 만들지 않는다.

## 검증

타깃 대조와 로컬 구현 검증 완료. 연결 구현/실제 화면/최종 검사와 통합은 [낱말 연결 task](20261015-connected-word-learning.md)에서 함께 관리한다. 임시 CMU 발음사전 조사와 별도 english-target-audit 작업 폴더는 취소된 단음절 정리의 흔적이며 제품 의존성으로 추가하지 않는다.

## main 포함 확인

873d1f808에 코드와 결정 기록을 함께 커밋하고 로컬 main에 fast-forward 통합했다. 같은 코드의433회귀/타입/build와 실제 화면 증거는 연결 task의 최종 검증 절을 따른다. 원격 main push/운영 배포는 이번 요청에 없으며 실행하지 않았다. 후속 통합 기록은 별도 문서 커밋이다.
