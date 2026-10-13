# Rive + Remotion: 가를 배워요

사용자 요청으로 만든24초·1920×1080·30fps 학습 영상 샘플입니다. [최종 영상](hangul-ga-learning.mp4), [16장 표본](contact-sheet.png), [검수 결과](verification.json)를 보존합니다.

다른 세션에서는 [인계 기록의 이어가기 절](../../docs/work/video/tasks/20261012-rive-remotion-learning-sample.md#다른-세션에서-바로-이어가기)부터 읽습니다. 영상·코드·입력 자산은 Git에 보존되어 있으며, 별도 작업 폴더나 이전 대화 없이 재개할 수 있습니다.

| 시간 | 장면 |
|---|---|
| 0~9초 | Rive ㄱ·ㅏ가 인사하고 만나서 가가 됩니다. |
| 9~16초 | Remotion/SVG로 ㄱ→ㅏ 세로→ㅏ 가로 순서로 가를 씁니다. |
| 16~24초 | 가방 그림과 가방 발음을 연결합니다. |

[승인한 Rive 파일](../../packages/remotion/public/hangul-sample-20261012/meeting.riv)을 공식 @remotion/rive4.0.440으로 직접 그립니다. Remotion이 장면·쓰기·삽화·음악·효과음·발음을 합성합니다. 기존 제품 Root.tsx는 수정하지 않았습니다.

새 [가방 이미지](../../packages/remotion/public/hangul-sample-20261012/bag.png)는 imagegen 스킬의 내장 도구로 생성한 RGBA 원본입니다. [프롬프트](../../packages/remotion/public/hangul-sample-20261012/image-prompt.txt)를 보존했습니다. 소리와 폰트는 기존 자산을 재사용했고, 가방 발음은 가·방 음절을 연결했습니다. [자산 출처·해시](../../packages/remotion/public/hangul-sample-20261012/sources.json), [폰트 라이선스](../../packages/remotion/public/hangul-sample-20261012/FONT-LICENSE.txt)를 참조합니다.

## 재실행

저장소 루트에서 실행합니다. Node/pnpm, Python(Pillow·NumPy), FFmpeg가 필요합니다. 보존된 자산으로 렌더하므로 R2 키나 운영 서버 부팅이 필요하지 않습니다. 웹 WASM은 공식 연동 컴포넌트가 unpkg의 @rive-app/canvas-advanced2.31.5에서 로드합니다.

```powershell
pnpm install --frozen-lockfile
pnpm --filter @tangobook/remotion typecheck
pnpm --filter @tangobook/remotion exec remotion still src/samples/hangul-probe-entry.tsx HangulRiveProbe ../../output/rive-remotion-learning-20261012/probe-ready.png --frame=110
pnpm --filter @tangobook/remotion exec remotion still src/samples/hangul-probe-entry.tsx HangulRiveProbe ../../output/rive-remotion-learning-20261012/probe-repeat.png --frame=110
pnpm --filter @tangobook/remotion exec remotion render src/samples/hangul-learning-entry.tsx HangulLearningSample ../../output/rive-remotion-learning-20261012/hangul-ga-learning.mp4 --codec=h264 --crf=18 --image-format=png --concurrency=3
ffmpeg -y -v error -i output/rive-remotion-learning-20261012/hangul-ga-learning.mp4 -vf "fps=2/3,scale=480:270,tile=4x4" -frames:v 1 output/rive-remotion-learning-20261012/contact-sheet.png
python scripts/rive-hangul/verify_learning_sample.py
```

이번 저장본은 음량 수정 후 같은 Remotion entry에서 WAV를 출력하고, 원래 영상 스트림을 재압축하지 않고 AAC192k로 합쳤습니다. 영상과 소리가 모두24.000초입니다. 직접MP4를 다시 만들면 AAC 끝 여백 때문에 파일 길이가 수십ms 늘어날 수 있으며 검수는 A/V차0.1초 미만을 확인합니다.

편집 원본은 [HangulLearningSample.tsx](../../packages/remotion/src/samples/HangulLearningSample.tsx), Rive 로딩 대기는 [TimedRive.tsx](../../packages/remotion/src/samples/TimedRive.tsx)입니다. 같은 Rive 프레임2회 RGB 일치, 발음10곳의 원음 파형·배치·중복 없음, 전체 디코드를 검사했습니다. 새로 사람이 전수 청취했거나 실기기 게임을 검증했다는 뜻은 아닙니다.

결정과 재개 방법은 [작업 기록](../../docs/work/video/tasks/20261012-rive-remotion-learning-sample.md)을 참조합니다. 클릭 게임·앱 연결·외부 게시·push는 수행하지 않았습니다.
