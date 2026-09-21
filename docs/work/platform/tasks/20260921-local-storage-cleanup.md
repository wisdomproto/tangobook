# 로컬 저장공간 진단과 안전한 정리

- id: 20260921-platform-local-storage-cleanup
- domain: platform
- status: paused
- updated: 2026-09-21
- base: 386883d9
- branch: main
- worktree: C:/projects/tangobook
- integration: main에 진단 기록 반영; 삭제 미실행
- delivery: 미푸시·미배포

## 요청과 완료 조건

C드라이브 공간 부족 원인을 조사하고 특히 TangoBook에서 불필요한 파일을 정리한다. 재생성 가능한 캐시와 보존해야 할 작업 자료를 구분하고 실제 디스크 여유 공간의 변화를 확인한다.

## 읽은 기억과 변경 범위

AGENTS.md, handoff README/MEMORY, work README, platform BRIEF/MEMORY, 루트 CLAUDE.md, .gitignore 및 work-status를 확인했다. 코드와 미커밋·미추적 작업, 복구 참조, 환경 파일은 보존한다.

## 결정과 진행

- 시작 시 main, 미추적 `.codex/` 확인. 등록된 worktree는 주 폴더 포함 47개이며 기록 없음은 폐기 가능함을 뜻하지 않는다.
- 시작 시 C드라이브 여유 66,905,260,032바이트(약 62.31GiB). OS가 관리하는 pagefile은 삭제 대상에서 제외한다.
- Git 디렉터리 약 2.88GiB, 주 폴더 packages는 node_modules를 제외하면 약 0.41GiB. Git 복구 기록과 자료는 유지한다.
- 크기는 링크·junction을 따라가지 않고 조사한다. 파일 길이 합계는 하드링크 공유 및 압축 때문에 물리 사용량과 다를 수 있다. 확보 공간은 드라이브 여유로 별도 측정한다.

## 검증

링크·junction을 제외한 파일 길이 합계: TangoBook 57.38GiB(node_modules 30.07, .draw 4.69, out 2.59, dist 0.74). 사용자 Hugging Face 모델 캐시 48.44GiB, uv 캐시 33.52GiB, pnpm 저장소 3.36GiB, npm 캐시 2.96GiB, pip 캐시 1.07GiB.

가장 큰 모델은 CogVideoX-5b-I2V 20.15GiB. 그 밖에 VoxCPM2, Qwen3-TTS, Chatterbox, Whisper 등이 있다. 모델 사용 여부는 확인하지 않았으며 삭제하지 않았다. uv 캐시 내부 Python을 사용하는 프로세스도 있어 uv 전체 삭제는 배제했다.

등록된 worktree에서 14일 이상 된 pnpm node_modules, junction이 아닌 것, Git 추적 파일이 없는 것, 프로세스 명령줄에 경로가 없는 것을 확인해 19개를 선정했다. 명령줄 검사는 사용 여부의 완전한 증명은 아니다. 주 폴더 의존성과 이를 가리키는 두 junction은 보존 대상이다. 목록은 사용자 Local/Temp의 tangobook-cleanup-targets-20260921.json에 보관했다.

검증된 절대 경로를 PowerShell Remove-Item으로 삭제하려 했으나 자동 승인 검토가 실행 전에 `blocked by policy`로 거부했다. 구체적 사유는 제공되지 않았고 우회하지 않았다. 실제 삭제는 없으며 최종 여유 공간 약 61.52GiB는 동시 작업에 의한 변동이므로 확보 공간으로 보고하지 않는다.

기능 코드 변경과 기능 테스트는 없음. 기록의 diff·링크·Git 상태를 확인한다.

## 다음 행동

정책상 허용되는 경로로 의존성 정리를 재개하거나 사용자가 검토된 폴더를 직접 정리한다. 의존성 삭제 후 해당 worktree를 재개할 때 pnpm install --frozen-lockfile로 재설치한다. 소스·미커밋 파일·삽화·영상·Git 복구 기록은 보존한다. 모델 캐시는 사용 여부 확인 후 개별 모델 단위로 검토한다.
