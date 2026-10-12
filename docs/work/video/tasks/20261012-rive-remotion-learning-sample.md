# Rive와 Remotion 한글 학습 샘플

- id: 20261012-video-rive-remotion-learning-sample
- domain: video
- status: integrated
- updated: 2026-10-12
- base: cc52c098b
- branch: codex/rive-remotion-learning-sample
- worktree: C:/Users/kil21/.codex/worktrees/rive-remotion-sample/tangobook
- integration: 제작13d7421c3을 로컬main28dfad736에 통합, 기존 제품 컴포지션 보존
- delivery: 샘플 완료·검수 통과, 후속 main push로 원격 추적 이력 포함 확인·운영 적용 미수행

사용자는 토도ㅡ/ㅇ쓰기 참고영상과 Rive+Remotion 조합 검토 후 “한번 만들어보자 샘플로”라고 요청했다. 기존 승인한 ㄱ·ㅏ 캐릭터 등장→만나서가→가쓰기→가방그림·발음 약20초 샘플을 만든다. 기존 image skill 지정은 유지한다. 운영 업로드·앱 적용·원격 push는 요청 범위가 아니다.

기존 [Rive 시안과 후속 검토](20261012-rive-hangul-meeting.md)를 읽고 managed worktree를 cc52c098b에서 만들었다. 원본·6초/9초 샘플은 그대로 보존한다. 설치된 Remotion4.0.440에 맞춰 @remotion/rive·paths4.0.440을 추가하고 실제.riv 호환을 먼저 시험한다. 제품 Root.tsx를 수정하지 않는 별도 entry를 사용한다.

제작 당시 새 가방 삽화는 내장 imagegen으로 생성했다. ㄱ/ㅏ/가·음악·효과음·쓰기 안내는 기존 로컬 학습 음원을 재사용했다. 가방은 기존 가·방 음절을 로컬 연결했다. 공개 CDN GET403을 확인하여 read-only S3 GetObject로 정확한 방 음원만 읽었고 운영 concat/API/서버 부팅을 하지 않았다. 당시 로컬 Voicebox17493은 실행 중이 아니었으며 새 TTS 생성 없이 기존 자산으로 완료했다.

## 제작 결과·검증

- @remotion/rive4.0.440 + canvas-advanced2.31.5에서 기존 Rive CLI1.5.1 파일의 실제 재생 성공. 첫 캡처는 WASM 로딩만 기다려 빈 canvas였다. TimedRive가 파일 로딩·첫 draw까지 대기하도록 수정했고, 같은 frame110을2회 렌더한 RGB 차이가0이다.
- 가방은 내장 imagegen으로1254×1254 RGBA 생성, alpha0~255 원본 픽셀 보존. 프로젝트 public 폴더의 bag.png/image-prompt.txt에 보존했다. 생성 원본 exec-4ec45a21-c4f6-4e9e-8551-36d5510f4ddb.png. 원본해시2d8138553dacf7fc5cdf82af871b7a8318edcaf204db1ef043737703541b76a1.
- 24초·1080p/30fps720frame·16표본 제작.0~9s 만남,9~16s3획쓰기,16~24s가방. 목소리10곳/기존BGM/효과음을 합성했다. 쓰기 안내는 “글자를 따라 써 봐” 원음, 가방은 기존 가·방을 무간격 연결했다.
- 초기 오디오float피크1.1445로 과출력 확인. 발음0.66/효과음0.14/음악0.025~0.05로 낮추고, 긴 ㄱㅏ가 음원과 반복가의0.26초 중복을 해소했다. 최종 음원은 Remotion에서 WAV로 다시 출력 후 원래 영상 스트림을 복사해서 AAC192k로 합쳤다. 최종 peak·음원별 상관/시간차는 verification.json에 기록한다.
- 최종720frame·24.000초 A/V·전체decode·피크0.99미만·발음10곳 상관0.9초과/시간차40ms미만·발음끼리중복없음·Rive원본SHA/가방alpha 검사 통과.16장 표본과 별도 만남/쓰기/낱말 렌더 육안 확인. 파형 검사는 전수 인간 청취와 구분한다.
- 설치 frozen-lockfile, Remotion전체타입검사, 지정소스 Prettier, Python py_compile/diff 검사 통과. 저장소 ESLint는 Remotion TSX 설정이 없어 해당파일을 ignored로 반환했으며 lint 통과로 보고하지 않는다. 기존 전체 제품 테스트는 독립 entry여서 실행하지 않았다.
- pnpm9 add가 관계없는 lockfile 메타데이터를 변경해 기존 내용을 보존하고 필요한2개 의존성만 추가했다. 정리 중 lockfile 중복키가 발생한 후보는 커밋하지 않았고 baseline+필요항목으로 복구 후 frozen 설치 통과했다.

## 재개·인계

[샘플 안내](../../../../output/rive-remotion-learning-20261012/README.md)의 영상·표본·프롬프트·자산/코드 링크와 실행 명령을 읽는다. 입력은 packages/remotion/public/hangul-sample-20261012에 전부 보존되어 있다. prepare_learning_sample.mjs는 기존파일을 재사용하고 방 음원이 없는 경우에만 S3 GET을 한다. 렌더에는 운영 자격증명이 필요하지 않다.

독립 entry는 packages/remotion/src/samples/hangul-learning-entry.tsx이다. 기존6초/9초 Rive와 제품 Root.tsx를 보존한다. 영상의 다음 피드백은 동작·쓰기 속도·말소리·장면 전환에 대해 받는다. 정식 학습 단원/성적/게임 연결과 외부 게시를 이 시안 승인으로 확대하지 않는다.

로컬main 통합 후 실제폴더에서 frozen 설치·Remotion전체타입검사를 다시 통과했다. 최종영상 SHA2568080c35c9f13e53ccb95a0efbc71c0d85d3312e59440d801d9f480482702c691,2,459,608bytes. 오디오피크-1.988dBFS,10발음 파형상관최소0.9934/시간차최대0.333ms. 인수인계·영역기억에 완료 상태를 연결했으며 외부 push는 없다.

## 다른 세션에서 바로 이어가기

2026-10-12 사용자가 “rive+remotion 다른 세션에서도 이어서 할수 있게 기록해두자”라고 요청했고, 명칭은 **Rive**로 정정했다. 이번 요청은 샘플과 제작 방법의 인계다. 24초 영상의 세부 연출에 대한 최종 승인 여부는 별도로 확인하지 않았다.

다음 세션에 사용할 문장:

> Rive+Remotion 한글 학습 영상 샘플을 이어서 작업하자. docs/work/video/tasks/20261012-rive-remotion-learning-sample.md와 output/rive-remotion-learning-20261012/README.md부터 읽고, 기존 ㄱ+ㅏ→가→가방 24초 샘플을 기준으로 진행해 줘.

읽을 순서와 실제 편집 위치:

| 목적 | 저장소 루트 기준 경로 |
|---|---|
| 결과·실행 명령 | [샘플 README](../../../../output/rive-remotion-learning-20261012/README.md) |
| 최종 24초 영상 | [hangul-ga-learning.mp4](../../../../output/rive-remotion-learning-20261012/hangul-ga-learning.mp4) |
| 장면·쓰기·음원 타이밍 편집 | [HangulLearningSample.tsx](../../../../packages/remotion/src/samples/HangulLearningSample.tsx) |
| Rive 첫 로딩 대기 | [TimedRive.tsx](../../../../packages/remotion/src/samples/TimedRive.tsx) |
| 독립 렌더 진입점 | [hangul-learning-entry.tsx](../../../../packages/remotion/src/samples/hangul-learning-entry.tsx), composition `HangulLearningSample` |
| 입력 자산·출처 | [sources.json](../../../../packages/remotion/public/hangul-sample-20261012/sources.json), 같은 폴더의 `.riv`·PNG·소리·폰트 |
| Rive 동작 자체 수정 | [9초 만남 원본 인계](20261012-rive-hangul-meeting.md#다른-세션에서-재개), `scripts/rive-hangul/build_meeting.py` |
| 렌더 후 검수 | [verify_learning_sample.py](../../../../scripts/rive-hangul/verify_learning_sample.py), [현재 검수 JSON](../../../../output/rive-remotion-learning-20261012/verification.json) |

- **기준은 main의 기록과 보존된 최종본**이다. 제작 브랜치는 `codex/rive-remotion-learning-sample`, 제작 커밋은 `13d7421c3`, main 통합 커밋은 `28dfad736`, 최초 완료 인계는 `0d6e849b1`이다. 남아 있는 제작 worktree의 `ready` 기록은 main 통합 전 스냅샷이므로 실제 Git 이력과 대조한다. 특정 worktree나 실행 중인 프리뷰에 의존하지 않는다.
- Node/pnpm으로 보존된 자산을 바로 렌더할 수 있다. Python(Pillow·NumPy)과 FFmpeg는 검수에 필요하다. 기존 입력을 다시 생성하거나 R2 자격증명을 준비할 필요가 없다. 첫 렌더는 Remotion 브라우저 다운로드와 Rive WASM 로드에 네트워크가 필요할 수 있다. Rive 동작을 재컴파일할 때만 기존 공식 CLI/RML 절차를 사용한다.
- 첫 로딩 대기를 제거하면 빈 Rive 캔버스가 다시 캡처될 수 있다. 음원 타이밍·볼륨 변경 후에는 검수 스크립트로 발음 중복·피크·원음 배치를 확인하고 실제 청취도 진행한다. 검수에 필요한 동일 frame110 probe 두 장의 명령은 README에 있다.
- 다음 작업은 사용자의 동작·쓰기 속도·발음·전환 피드백을 반영하거나 다른 글자/낱말로 확장하는 것이다. 인터랙티브 게임은 가능성만 논의했으며 이 샘플에는 구현하지 않았다. 기존 제품 `Root.tsx`에는 연결하지 않았다.

이번 인계 시 로컬 `origin/main` 추적 ref `17e2f93ef`에 제작 커밋 `28dfad736`이 포함됨을 확인했다. 별도 [main push 작업](../../platform/tasks/20261012-phonics-ui-effects-main-push.md)의 후속 통합 결과이며, 위 제작 당시의 “미푸시”는 당시 상태다. 이번 기록 요청으로 새 push·배포는 수행하지 않는다.
