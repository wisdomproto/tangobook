# 영어 파닉스 dragon 타깃 제외

- id: 20261015-english-dragon-target
- domain: phonics
- status: integrated
- updated: 2026-10-15
- base: da941bcb8
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 11324f039 로컬 main 포함 확인
- delivery: 미푸시·미배포

## 요청·원인

사용자가 dragon이 파닉스 타깃에 들어 있는 이유를 물으며 제외를 지시했다. 기존 영어4권 en-b4-u04(dr/pr/tr)의 shared sampleWords와 공개 책의 targetWords·wordFamilies·flashcards에 존재했다. Git blame상 2026-02-27 dbd74f19f2부터이며 구체적인 선정 사유 기록은 확인하지 못했다. dr 시작 예시로 선정되었을 가능성은 추론이며 기록된 사실과 구분한다. 새 낱말 연결 작업에서 drag/on으로 억지 분할하려던 방향은 철회했다.

## 수정

- shared 커리큘럼 예시에서 dragon 제외. dr의 기존 dress/drive/drum 유지, 새 삽화·음원 생성 없음.
- 오래된 공개 책도 학습 화면에서 config/family/flashcards를 함께 필터링한다. Query 원본을 변형하지 않고 useMemo로 안정적인 복사본을 전달하므로 게임 리렌더/리롤을 만들지 않는다.
- 패턴 익히기·듣기 보기·게임 및 복습 대표어 후보까지 적용. 다른 동화의 dragon이나 기존 동화 장면/그림 데이터는 삭제하지 않는다.
- 운영 R2 데이터 수정·push/배포는 이번 범위에 포함하지 않는다.

## 조사 기준과 후속

단순히 단어 길이나 음절 수만으로 모든 영어 낱말을 일괄 제거하지 않는다. 알파벳 첫소리 소개용 예시어와 아이가 직접 해독하는 타깃은 역할이 다르다. 해독 타깃은 해당 단계까지 배운 GPC로 읽을 수 있는지 검토한다.

- Oxford ELS 공식: 배운 소리에 맞는 decodable 읽기 자료 제공. https://home.oxfordowl.co.uk/reading/reading-schemes-oxford-levels/essential-letters-and-sounds/
- DfE SSP 기준: 명확한 누적 GPC 순서와 그에 맞는 읽기 자료. https://www.gov.uk/government/publications/phonics-teaching-materials-core-criteria-and-self-assessment/validation-of-systematic-synthetic-phonics-programmes-supporting-documentation

위 자료가 dragon 자체를 금지한 것은 아니다. 제거는 사용자 결정이다. 영어4·5권에는 cherry/photo/elephant 등 여러 음절·철자 규칙이 섞인 기존 타깃도 있어 단계 적합성을 계속 검토해야 한다. 전체 타깃 난이도 개편을 완료했다고 보고하지 않는다. 같은 낱말 블록→쓰기→색칠 및 ㅇ 모음 연결 구현은 별도 진행 중이며 이 수정 커밋에 섞지 않는다.

## 검증

- learning-targets 회귀: 기존 source의 세 경로·복습 재유입 차단, 원본 불변·일반 동화 보존. 기존 영어 host 회귀와 관련 단위 검사 통과.
- 현재 작업 폴더 client typecheck 통과. 관련 phonics 전체 + 기록/색칠 hook 47파일 376검사 통과(진행 중인 낱말 연결 변경 포함한 작업 폴더 검증이며 이 단일 커밋만의 독립 실행이라고 주장하지 않는다).
- 실제 로컬5187 en-b4-u04/learn-dr_에서 dress/drive/drum 세 행 표시·dragon 없음 확인. screenshot output/connected-word-learning-20261015/dr-targets.png. 운영 배포 검증 아님.

## 로컬 main 검증

11324f039을 main에 fast-forward 통합했다. main checkout에서 shared build, learning-targets/useReviewCardSources/EnglishPhonicsActivityPage 3파일10검사와 client typecheck 통과. 관련 코드 외 미커밋 낱말 연결 변경은 원래 worktree에 보존하며 main에 포함하지 않았다. 원격 push·운영 반영 없음.
