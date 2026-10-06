# 가상 육아 인플루언서 — 집·가구 3D 샘플

- id: 20261006-marketing-virtual-parenting-home-sample
- domain: marketing
- status: ready
- updated: 2026-10-06
- base: c73189d95
- branch: codex/marketing-virtual-parenting
- worktree: C:/projects/tangobook/.worktrees/virtual-parenting
- integration: 미통합
- delivery: 로컬 샘플·뷰어, 미푸시·미배포

## 요청과 완료 조건

사용자는 가상 육아 인플루언서가 같은 집에서 아이와 노는 쇼츠/카드뉴스를 지속 제작할 수 있는지 검토한 뒤 샘플 제작을 요청했다. 이어 집과 가구를 실제 3D로 만들고 둘러볼 수 있도록 요청했다. 첫 샘플의 완료 범위는 정지 이미지, 실제 집/가구 3D 파일과 로컬 인터랙티브 뷰어다. 쇼츠 영상이나 운영 앱 편입/외부 게시 요청은 아니다.

## 사용자 결정

- 정확한 레퍼런스는 Instagram `@__siu.mom`, 책육아하는 시우맘이다. 먼저 검색된 `@xoxo.siwoo`는 다른 인물이며 레퍼런스로 사용하지 않는다.
- 집이 매우 깔끔해서 다른 엄마들이 부러워하는 분위기가 중요하다.
- 엄마는 굳이 화면에 등장하지 않아도 된다.
- 집뿐 아니라 가구도 모델로 만들어 3D로 볼 수 있어야 한다.
- 실존 인물 얼굴/집의 정밀 복제 대신 독자적인 가상 집과 아이로 샘플을 만든다. 마지막 항목은 작업자의 제작 선택이며 사용자 확정 페르소나가 아니다.

## 읽은 기억과 변경 범위

handoff README/MEMORY, work README, marketing/video/content/hardware BRIEF·MEMORY, 루트 CLAUDE, 기존 Qwen 로컬 시험 기록을 확인했다. 이미지 스킬의 프롬프트 원칙을 참고하되 프로젝트의 사용자 지정 로컬 Qwen 기본 경로를 우선했다. 정지 이미지와 3D 파일 작업이므로 영상 제작 흐름은 시작하지 않았다.

최신 origin/main fetch 후 별도 worktree/브랜치를 만들었다. 기존 루트 `codex/video-rapunzel`과 미추적 output/은 그대로 두었다. 소스는 `scripts/virtual-parenting/`, 실제 이미지·3D 바이너리·history는 `D:/ComfyUI-output/virtual-parenting-20261006/`에 보존한다.

## 제작과 검증

- ComfyUI 8190 큐 running/pending 모두 0 확인 후 Qwen-Image-2.1 INT8 기본 25스텝으로 864×1536 독서 이미지 1장 생성. prompt ID `99094640-1ec9-4ab7-8887-78c2304a5161`, history success, caller wall132.23초. 모델 캐시를 재사용했으므로 냉시작 시간 아니다.
- 이미지 원본 직접 확인: 한 명의 가상 아이, 엄마 없음, 책과 두 손/테이블, 밝은 원목·화이트 공간. 3D 렌더가 아닌 분위기 시안으로 구분한다.
- Blender 4.5.9로 9×7m/층고2.9m 오픈플랜 세트 생성, 17개 그룹(건축4 + 가구/소품/조명13). BLEND 저장, GLB export 및 Cycles 정지 렌더 성공.
- 실시간 뷰어에 GLB 로딩/집 전체/평면 보기/테이블 선택과 220×105×76cm 표기를 실제 브라우저에서 확인했다. 첫 전체 시점은 옆벽이 소파와 책장을 가리는 반증이 있어 옆벽 기본 숨김/표시 토글로 수정했다. 밝기가 지나치게 날아간 표본을 보고 조명/노출을 낮췄다.
- localhost5191은 별도 Python 정적 파일 서버로 운영 API/예약 발행 코드 미사용. 서버 PID는 D폴더 `viewer-server.pid`, 로그도 같은 폴더. 로컬 뷰어 링크 제공용으로 유지한다.
- 제품 코드·R2·DB·외부 채널 변경 없음. monorepo 테스트는 제품 변경이 없어 미실행. 검증 범위는 로컬 3D 생성/정지 이미지/브라우저 동작이며 실사 영상·시리즈 일관성 검증은 아니다.

## 다음 행동

사용자가 집/가구 분위기를 보고 수정한다. 집 구조·가구 배치가 확정되면 동일 BLEND를 기준으로 촬영 카메라와 아이 캐릭터를 추가한다. 현재 3D 집에는 아이 모델/리깅이 없고 정지 이미지와 집 배치는 동일하지 않다. 다중 콘텐츠에 같은 집을 유지하는 시험과 쇼츠 제작은 후속 범위다.
