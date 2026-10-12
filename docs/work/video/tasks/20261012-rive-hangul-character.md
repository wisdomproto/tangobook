# 한글 글자 캐릭터 Rive 춤 시안

- id: 20261012-video-rive-hangul-character
- domain: video
- status: completed
- updated: 2026-10-12
- base: e12a07a6a
- branch: main
- worktree: C:/project/tangobook
- integration: 로컬 main에 시안 원본·제작 코드·기록 포함, 앱 통합 없음
- delivery: 미푸시·미배포

## 요청과 완료 조건

사용자는 한글떼 오프닝(https://www.youtube.com/watch?v=nbtDE0tKBic)처럼 글자 자체에 눈·입·팔다리가 붙어 움직이고 춤추는 캐릭터를 요청했다. 도구는 Rive, 필요한 이미지는 image skill로 생성하도록 명시했다. 첫 시험은 ㄱ 한 명의 6초 춤으로 진행한다. 실제 Rive .riv와 생성 이미지, 소스 및 동작 검수 결과를 로컬 보존한다.

## 읽은 기억과 변경 범위

공통 인수인계·MEMORY, PLATFORM, 작업 지도, video BRIEF·MEMORY·tasks 인덱스, 루트 CLAUDE 및 audiobook 지침을 읽었다. 제품 코드·운영 데이터 변경 없는 독립 시안이다. scripts/rive-hangul와 output/rive-hangul-20261012 및 이 기록만 관련 범위다.

## 결정과 진행

- 참고 영상의 0:03/0:29 화면에서 도톰한 입체 자음·눈·입·가느다란 팔다리를 확인했다. TV 캐릭터를 복제하지 않고 새로운 ㄱ 캐릭터를 만든다.
- 사용자 지정 imagegen 스킬의 내장 생성 도구로 진짜 투명 배경의 빈 ㄱ 몸통을 생성했다. 원본: C:/Users/kil21/.codex/generated_images/01a12e96-109b-7e71-9a4c-750a759e338c/exec-71457d07-949d-4530-9cec-d1c7dd8c5025.png. 프롬프트 전문은 시안 폴더의 image-prompt.txt에 보존했다.
- Rive 연결 플러그인 검색 결과 없음. 웹 편집기는 빈 화면 상태였지만 공식 Rive CLI/RML 경로를 확인했다. 공식 배포 SHA256 확인 후 CLI 1.5.1을 사용자 .codex/tools/rive-cli에 로컬 준비했다. 계정·MCP 설정은 변경하지 않았다.
- Rive 프로젝트의 AGENTS.md를 읽었다. Node 관절·native 얼굴·limbs·키프레임과 이미지 몸통으로 제작하며 HTML 모사로 대체하지 않는다. 무음 시안이며 노래·발음 음원은 이번 최초 시험에 포함하지 않는다.

## 검증

- 공식 CLI `--verify` 0 errors / 0 warnings, `inspect --summary` problems 없음. 1 ImageAsset, 12 Node, 44 Shape, 424 keyframes, 1 timeline·state machine. 스크립트 없는 native Rive 파일이다.
- 이미지 1254×1254 RGBA, alpha 0~255 확인. 몸통은 오른쪽 끝에서 아래로 내려가는 정확한 ㄱ이며 고정 전면의 2.5D PNG다. 실제 3D 회전은 지원하지 않는다.
- 실제 Rive로 180개 고유 프레임을 렌더했다. 0.23s 스텝/1.13s 눈 깜빡임/4.5s 점프 포함 대표 개별 프레임과 12장 contact-sheet를 육안 검수했다. 글자 몸통·팔·다리 연결 유지와 화면 내 여백 확인.
- 전체 28개 키프레임 속성의 첫/끝 수치 일치. advance=1과 advance=361 실제 렌더 비교 평균 RGB 차이 각 0.00024/255 이하. 미세한 antialias 차이가 있으며 완전 byte 일치로 보고하지 않는다.
- MP4 960×720, 30fps, 180프레임, 정확히 6초, 전체 decode 통과. GIF 640×480 반복본도 제작했다. 음원 없음. `output/rive-hangul-20261012-review/verification.json`에 원본·.riv·MP4·GIF SHA256 기록.
- 최신 원격 기준 확인을 위해 git fetch origin 수행. 원격의 다른 작업을 시안에 합치거나 push하지 않았다. 제품 TypeScript·전체 테스트는 앱 코드 변경이 없어 수행하지 않았다.

## 다음 행동

사용자 시안 피드백에 따라 표정·춤 강도·색을 조정한다. 이어서 ㄱ+ㅏ 결합 놀이 등 학습 활동을 만들 수 있다는 논의가 있었으나 이번 요청에서 게임을 구현하도록 확정하지 않았다. 음원과 앱 학습 기록 연동도 후속 범위다. `.rev` 편집기 파일 내보내기는 Rive 계정 로그인이 필요하여 이번 로컬 제작에서는 하지 않았다.

## 인계·통합

생성 원본·RML·프롬프트·rive.yaml·제작 스크립트·기억은 로컬 main 커밋한다. runtime .riv와 PNG180/MP4/GIF/검수 JSON은 output 아래 로컬 보존한다. 외부 게시, Rive 계정 업로드, 운영 앱 등록, push/배포 없음. 기존 미추적 output·tmp와 다른 worktree는 보존했다. Rive native 미리보기와 Codex MP4 패널을 열어 결과를 제공한다.
