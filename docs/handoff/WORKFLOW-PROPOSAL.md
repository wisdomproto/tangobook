# 기능별 기억과 병렬 작업 운영안

2026-09-21 초기 제안. 사용자 승인 후 [실제 작업 지도](../work/README.md), 12개 영역 BRIEF/MEMORY, 작업 조회와 선택형 대화 지침을 구축했다. 아래는 설계 당시 제안이며 현재 절차는 작업 지도를 따른다. 기존 메모리 전체 본문 이관과 독립 실행 에이전트 등록을 의미하지 않는다.

## 목표

사용자는 같은 동료와 계속 이야기하는 느낌으로 작업한다. 기능명만 말해도 지난 결정, 현재 상태, 실패한 시도와 다음 할 일을 읽고 이어간다. 브랜치와 worktree의 수명보다 지식의 수명이 길어야 한다.

## 조사 범위와 현재 문제

- client 기능 디렉터리 40개, 기능별 CLAUDE.md 15개, 기존 전문 에이전트 14개의 목록·역할, 서버 routes 목록, hardware 4개 디렉터리, 루트 지침과 인수인계를 확인했다. 전체 기능의 코드를 정밀 감사하거나 모든 개인 메모리 본문을 검토한 것은 아니다.
- 기존 에이전트는 콘텐츠 집필·검수·영상·전략 등에 강하다. 편집기 개발, 회원/결제, 플랫폼 공통, 하드웨어 담당 지침은 보완할 여지가 있다.
- board-vision은 하드웨어와 학습 화면을 소관 밖으로 명시한다. 카메라·하드웨어·학습 기능을 같은 기억으로 합치면 경계가 흐려진다.
- marketing-specialist에는 과거 포지셔닝 요약이 남아 있고 현재 STRATEGY.md의 정체성과 다르다. 기존 기억을 모두 현재 규칙으로 복사하지 말고, 결정 원본과 날짜를 확인해야 한다.

## 권장 영역 12개

영역은 지식 분류다. 12개 브랜치나 실행 에이전트를 상시 만들어두라는 뜻은 아니다. 아래 디렉터리명은 client features 기준이며 서버의 관련 route/service와 shared 타입까지 함께 관할한다.

| ID | 사용자에게 보일 이름 | 범위 | 기존 지침 활용 / 보완할 담당 역할 |
|---|---|---|---|
| authoring | 동화책 저작도구 | storybook, editor, book-v2, character, cover, illustration, key-object, translation, tts, library | 기존 storybook/editor CLAUDE 활용; 저작도구 개발 담당 보완 |
| content | 동화·만화 콘텐츠 제작 | 생활·창작·명작 등 기획, 집필, 장면, 그림체, 콘텐츠 검수; docs/books·comics·saenghwal-donghwa 등 | changjak-director, comic-writer, comic-editor, scene-writer, scene-text-matcher, art-director 유지 |
| phonics | 파닉스·어휘 | phonics, phonics-learner, vocabulary, vocabulary-unit; 언어별 교육 순서·음원·쓰기 | phonics-builder와 game-reviewer 활용; 언어별 결정은 하위 문서로 분리 |
| games | 게임·독후활동 | games, activity, arcade-games, coloring, puzzle, quiz, playground, hori-room, rewards | game-reviewer 유지; 게임 구현 담당 보완 |
| reading | 책 읽기·학습 기록 | viewer, continuous, learning, ebook-mosquito; 재생·읽기·학습 이력 | viewer/learning CLAUDE 활용; 학습 경험 담당 보완 |
| camera | 카메라·블록 인식 | tango-reco.js, 보드 실험 화면, 프레임 수집, 인식 엔진·카메라 연결 | board-vision과 board-camera 인수인계 유지 |
| hardware | 실물 교구·3D 설계 | hardware/lrrh, periscope, stand, studboard; 도면·종이 시트·공차·출력 검증 | 하드웨어 담당 지침 보완; 인식 입력 규격은 camera와 공유 |
| video | 영상·오디오북 제작 | audiobook, longform-video, packages/remotion; 렌더·자막·음성·릴스 | video-producer 유지 |
| marketing | 마케팅·채널 운영 | marketing, blog, blog-public, card-news; SEO·배포 콘텐츠·채널 분석 | marketing-specialist, naver-blog-manager, youtube-strategist 유지; 포지셔닝 원본 정합성 수정 |
| account | 회원·결제·운영 | auth, access, members, payment, ops, feedback, settings | auth CLAUDE 활용; 회원/운영 담당 보완 |
| platform | 공통 기반·배포 | shared, 공통 UI/오디오/i18n, 서버 middleware/providers/repositories, 저장소·테스트·빌드·배포 | 공통 기반 담당 보완; 기능별 데이터 로직은 해당 영역과 공동 확인 |
| strategy | 제품·사업 전략 | STRATEGY.md, ROADMAP.md; 정체성·우선순위·사업 모델 | strategy-director 유지; 전략 원본을 memory에 중복 복사하지 않음 |

게임 안의 카메라 연결 변경은 camera가 주담당이고 games/phonics 화면을 함께 검증한다. 영상 제작은 video, 채널 편성과 성과 해석은 marketing이다. 공통 R2 코드 변경과 콘텐츠 한 권 제작은 별개 작업이다.

## 영구 보관할 파일 구조

아래는 제안 경로이며 아직 생성되지 않았다.

```text
AGENTS.md                         # 짧은 시작 절차와 기능 선택 규칙
docs/handoff/MEMORY.md             # 프로젝트 공통 기억·사용자 선호
docs/work/README.md                # 기능 지도, 읽을 파일, 시작 예시
docs/work/<영역>/BRIEF.md           # 담당 범위·코드 진입점·검증법·기존 에이전트 연결
docs/work/<영역>/MEMORY.md          # 현재 상태·유효한 결정·반증·미해결·다음 행동
docs/work/<영역>/tasks/<작업ID>.md   # 작업별 진행·중단·검증·통합 기록
```

BRIEF는 담당자가 어떻게 일할지, MEMORY는 무엇을 알고 이어갈지를 담는다. 기존 `.claude/agents`의 전문 지침은 연결해서 재사용하고, Codex 도구 지원 여부와 실행 설정은 별도로 확인한다. Markdown 파일을 놓는 것만으로 독립 실행 에이전트가 자동 등록되는 것은 아니다.

모든 기능 시작 시 루트 지침 → 공통 기억 → 선택 영역 BRIEF/MEMORY → 진행 중 task → 필요한 기존 전문 지침 순으로 읽는다. docs 아래의 문서는 경로가 존재한다고 자동 로드된다고 가정하지 않고 AGENTS.md에 명시적으로 읽는 규칙을 둔다. 공식 근거: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

기능 MEMORY에는 다음을 짧게 유지한다.

1. 마지막 갱신 날짜, 확인한 코드 버전과 현재 목표.
2. 확정된 결정과 이유, 근거 원본 링크.
3. 반증된 시도와 재시도 조건.
4. 현재까지 검증한 것과 아직 검증하지 않은 것.
5. 남은 문제, 바로 다음에 할 행동, 진행 중 task 링크.

작업 기록에는 목적, 관련 영역, 시작 커밋, 브랜치/작업 위치, 변경 파일, 사용자 결정, 재현 방법, 테스트 결과, 남은 일, 통합 상태를 기록한다. 로컬 절대경로만 의존하지 않고 상대 코드 경로·커밋·재현 명령도 남긴다. 비밀값과 대용량 자료는 넣지 않는다.

## 대화 시작 방식

- “카메라 이어서 하자” → 관련 기억과 실제 Git 상태를 확인한 뒤 “지난번 X까지 했고 Y가 남았습니다. Y부터 이어가겠습니다”처럼 짧게 알린다.
- “작업 시작하자” → 진행 중 작업부터 제시하고, 새 기능 선택도 제공한다. 12개를 매번 펼치지 않고 최근 작업·새 작업·전체 현황부터 고르게 한다.
- “어제 하던 거” → 현재 대화와 task 기록을 먼저 확인한다. 후보가 여럿일 때만 고르게 한다. 기억이 없으면 아는 척하지 않는다.
- 구체적인 수정 요청이면 기능 선택 질문을 생략하고 자동으로 분류한다.
- 선택 UI는 현재 대화에서 제공되는 선택형 질문으로 구현 가능하다. 앱을 열자마자 상시 드롭다운이 자동 표시되는 기능으로 약속하지 않는다. 사용자가 첫 메시지를 보낸 뒤 응답하는 흐름을 기준으로 한다.

선택 예시:

```text
어떤 작업을 이어갈까요?
  카메라 — 흰 판의 남은 인식 실패 조사
  다른 진행 중 작업 — 실제 기록에서 목록 생성
  새 기능 작업 — 영역 선택
  전체 현황 보기
```

## main에서 시작하고 여러 작업을 병행하는 절차

1. main의 로컬 변경·미푸시 커밋·원격과의 차이, 기존 worktree와 작업 기록부터 확인한다. 원격을 fetch하더라도 로컬 main의 미푸시 커밋을 버리거나 자동 push하지 않는다.
2. 기존 작업이면 그 작업 위치를 재사용한다. 새 작업이면 시작 지점을 확정하고 임시 브랜치 `codex/<영역>-<작업>`와 worktree를 만든다. 새 Codex 작업 생성은 사용자가 요청했을 때 한다.
3. 선택 기능의 기억을 읽고 task 기록을 남긴 뒤 구현한다. 여러 작업의 서버 포트·출력 경로를 분리한다. worktree는 운영 R2/DB까지 분리해주지 않으므로 테스트 저장 대상도 구분한다.
4. 중간 결론·사용자 결정·실패를 작업 도중 해당 task에 기록한다. “완료할 때만 기억 저장”하면 중단된 작업이 유실된다.
5. 완료 시 코드와 task 기록을 함께 커밋한다. main 통합은 한 작업씩 하고, 최신 변경과 실제 diff를 확인한 뒤 관련 통합 검증을 한다.
6. 통합 시 해당 영역 MEMORY에 유효한 결론을 반영한다. main에서 커밋되고 기억 파일이 포함됐는지 확인한 다음 작업 폴더와 브랜치를 정리한다. push/배포는 현재 사용자 요청에 따른다.

동시 작업은 각자의 tasks/<작업ID>.md에 기록해서 하나의 MEMORY.md를 계속 덮어쓰는 충돌을 줄인다. main에 합칠 때 MEMORY를 순서대로 갱신한다. 중단된 작업은 main에 아직 없을 수 있으므로 시작 시 worktree도 확인해야 한다. 공통 타입·공유 음원·잠금 파일·배포 설정을 동시에 수정해야 하면 담당 작업을 정하고 순서를 조율한다.

## 적용 순서

1. 기능 지도와 시작/재개 규칙을 만들고 기존 에이전트·메모리 원본을 연결한다.
2. 12개 영역의 짧은 BRIEF/MEMORY를 실제 근거로 작성한다. 확인하지 않은 상태는 미확인으로 표시한다. 기존 기억 300개는 분야별로 목록을 분류한 뒤 우선순위에 따라 본문을 검토한다.
3. 최근 작업인 camera부터 “기억 읽기 → 재개 → 중간 기록 → 통합 → 새 대화에서 재개”를 검증한다.
4. 기존 14개 에이전트의 오래된 주장과 중복 경계를 정리하고, 부족한 개발 담당 역할을 필요한 영역부터 보완한다.

이 안에서는 기능별 브랜치·worktree 12개를 미리 만들지 않는다. 지식은 지속적으로 유지하고 실제 진행 중인 작업만 분리한다.
