# 탱고북 작업 시작과 이어가기

사용자는 기능명과 원하는 일만 말한다. 담당자는 기록을 먼저 읽고 지난 맥락을 복원한다. 브랜치와 작업 폴더를 정리해도 결정과 검증 기록은 저장소에 남긴다.

## 시작 절차

1. 루트 AGENTS.md와 공통 MEMORY를 읽고 Git root·branch·status·worktree를 확인한다.
2. `node scripts/work-status.mjs`로 각 worktree의 등록된 작업을 확인한다. 경로가 사라졌거나 기록 없는 worktree는 미확인으로 취급한다. 오래된 폴더 이름만 보고 작업을 재개하지 않는다.
3. 아래 지도에서 주담당 영역을 고르고 해당 BRIEF.md와 MEMORY.md, 관련 task를 읽는다. 관련된 두 번째 영역은 필요한 문서만 추가한다.
4. 사용자에게 마지막 결론·남은 문제·다음 행동을 2~3문장으로 알리고 계속한다. 이미 기록된 내용을 다시 설명해 달라고 하지 않는다.
5. 신규 구현을 병행하면 최신 로컬 main과 origin/main의 차이를 확인하고, 로컬 미푸시 커밋을 보존한 시작점에서 `codex/<영역>-<작업>` 브랜치와 worktree를 만든다. 이전 작업이면 기존 위치를 재사용한다. 새 앱 작업 생성은 사용자가 요청했을 때만 한다.

## 기능 지도

| 말할 기능 | 담당 지침 | 기억 |
|---|---|---|
| 편집기·저작도구 | [authoring](authoring/BRIEF.md) | [MEMORY](authoring/MEMORY.md) |
| 동화·만화 집필·그림체 | [content](content/BRIEF.md) | [MEMORY](content/MEMORY.md) |
| 파닉스·어휘·쓰기 | [phonics](phonics/BRIEF.md) | [MEMORY](phonics/MEMORY.md) |
| 게임·독후활동 | [games](games/BRIEF.md) | [MEMORY](games/MEMORY.md) |
| 읽기·뷰어·학습 기록 | [reading](reading/BRIEF.md) | [MEMORY](reading/MEMORY.md) |
| 카메라·블록 인식 | [camera](camera/BRIEF.md) | [MEMORY](camera/MEMORY.md) |
| 실물 교구·3D·거치대 | [hardware](hardware/BRIEF.md) | [MEMORY](hardware/MEMORY.md) |
| 영상·릴스·오디오북 | [video](video/BRIEF.md) | [MEMORY](video/MEMORY.md) |
| 마케팅·블로그·채널 | [marketing](marketing/BRIEF.md) | [MEMORY](marketing/MEMORY.md) |
| 회원·결제·운영 | [account](account/BRIEF.md) | [MEMORY](account/MEMORY.md) |
| 공통 코드·서버·배포 | [platform](platform/BRIEF.md) | [MEMORY](platform/MEMORY.md) |
| 제품·사업 전략 | [strategy](strategy/BRIEF.md) | [MEMORY](strategy/MEMORY.md) |

경로·키워드·기존 에이전트 연결은 [domains.json](domains.json). 키워드는 후보 검색용이다. 요청 의미와 코드 소유 경계가 우선한다. 전문 에이전트는 [.claude/agents](../../.claude/agents)의 지침을 재사용한다. 새 담당 역할은 각 BRIEF로 제공하며, 독립 실행 에이전트 자동 등록을 의미하지 않는다.

## 선택형 대화

- “카메라 이어서 하자”, “편집기 저장 버그 고쳐줘”: 선택 질문 없이 관련 기억부터 읽는다.
- “작업 시작하자”: 현재 대화 맥락과 실제 작업 목록에서 최근 미완료 작업 1~3개, 새 기능 작업, 전체 현황을 선택형 질문으로 제시한다.
- “새 기능”: 위 12개 이름을 선택지로 제시한다. UI 제한이 있으면 제작/학습/교구/운영 그룹으로 나누어 묻는다.
- “어제 하던 거”: 날짜 하나로 단정하지 말고 대화와 task 기록을 대조한다. 후보가 여러 개일 때만 질문한다.
- `request_user_input_async`가 있으면 제목에 목적을 적고 options에 실제 후보를 넣는다. 권한 요청에 쓰지 않는다. 응답 전에는 선택한 것으로 간주하지 않는다. 도구가 없으면 최종 메시지에 번호 목록으로 묻는다.
- 선택지는 사용자 첫 메시지에 응답하여 제시한다. 앱 시작 시 자동 팝업이나 상시 드롭다운은 구현하지 않았다.

## 작업 기록과 기억 갱신

[TASK-TEMPLATE.md](TASK-TEMPLATE.md)를 해당 영역의 tasks/날짜-작업명.md로 복사한다. 상태는 planned / active / paused / ready / integrated 중 하나다. 목록 도구가 읽는 필드는 템플릿의 영어 키를 유지한다.

- 시작 시 요청·시작 커밋·영역·브랜치·관련 파일을 기록한다.
- 사용자 결정, 반증, 중요한 실패, 중단 직전에 task를 갱신한다. 끝날 때까지 기억 저장을 미루지 않는다.
- 여러 작업은 서로 다른 task 파일에 쓴다. 공통 MEMORY는 통합할 때 순서대로 갱신한다.
- ready는 검증됐지만 main에 아직 합치지 않은 상태다. integrated는 코드와 해당 기억이 main에 포함된 것을 확인한 상태다. 원격 push·배포 상태는 별도 필드다.
- 완료 보고 전 코드와 기록을 함께 커밋하고, 실제 포함 여부와 검증 결과를 대조한다. 문서에 자기 자신이 포함된 커밋 해시를 억지로 적지 말고 Git 이력에서 조회한다.
- 결정 원본을 링크하고 중복 복사하지 않는다. 제품 방향은 STRATEGY, 실행 톤은 brand-brief, 영역 상태는 영역 MEMORY, 진행 상태는 task가 원본이다.

## 병렬 개발과 통합

한 작업당 worktree/브랜치 하나. main에서 통합은 순서대로 한다. 공통 타입·음원·설정·lockfile을 함께 수정하면 담당 작업을 정한다. 다른 작업의 내용을 읽기 전용으로 참고할 수 있지만 미커밋 파일을 가져오거나 덮어쓰지 않는다.

포트와 출력 경로를 구분하고 로컬 발행 스케줄러를 끈다. worktree가 R2/DB까지 격리하는 것은 아니다. 운영 데이터 쓰기는 요청 범위를 확인한다.

main 통합 후 관련 검증과 MEMORY 반영을 확인하고, worktree의 미커밋/미추적/무시 파일 중 필요한 자료를 보관한 뒤 정리한다. 원격 push는 요청받은 작업만 수행한다. 파일이 남아 있으면 강제 제거하지 않는다.

## 과거 기억과 한계

[LEGACY-MEMORY.md](LEGACY-MEMORY.md)는 300개 원본의 파일명 기반 검색 목록이다. 본문 전체 이관은 아니다. 필요한 과거 결정부터 읽고 현재 코드와 대조한다. [기존 인수인계](../handoff/README.md)도 유지한다.

기록되지 않은 다른 대화나 미이관 worktree를 알고 있다고 가정하지 않는다. work-status는 읽을 위치를 찾는 도구이며 작업의 정확성이나 현재 실행 여부를 자동 보증하지 않는다.
