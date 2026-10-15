# 가갸거 송 — Rive + Remotion 시안

## main 통합·원격 push 완료 — 2026-10-15

승인 영상·코드·작업 기록57파일을 최신main에 통합한 `3548547aa`를 일반push하고 원격main SHA일치를 확인했다. 이제 **이 통합커밋을 포함하는 최신main을 재개 기준으로 사용한다.** 아래 원제작D:/tangobook-samples/gagya-song/codex/video-gagya-song 및 미푸시 설명은 당시 이력이며 이 절이 우선한다. 통합 작업 폴더는 D:/tangobook-samples/gagya-song-main이다.

승인MP4와모든자산은이checkout에도같은상대경로로보존된다. main의 `output/gagya-song-20261015/approved-v5.mp4`·이README·`docs/work/video/tasks/20261015-gagya-song.md`부터읽고이어간다. [승인 manifest](approved-v5.json)의 integrated_source_commit가원격main에존재하는소스기준이다. 승인본내용/SHA/재현명령은동일하다.

## 승인본과 다른 세션에서 재개

**2026-10-15 사용자가 v5를 승인했다.** 기준 영상은 [approved-v5.mp4](approved-v5.mp4)이며 Git에 보존한다. D드라이브의 revision-v5/gagya-song-1080x1920.mp4와 SHA256이 동일하다. 7,566,285bytes, SHA256 `2febfb74f88feb8246290d65c9113701ca92a9f6c683493aad3f7df8d9905fe2`. [승인 manifest](approved-v5.json)에 최종 파일과 제작 커밋을 연결했다.

확정 연출: 원곡 전체22초·가갸거겨고교구규그기 반복, 중앙 글자는330/400px의 차분한 제자리 반동, 입술/하단 작은 글씨/ㄱ 캐릭터 없음. 기차는 낮은 위치에서 **오른쪽→왼쪽**으로 정지 없이 부드럽게 통과하고, 기관차와 객차는 같은 레일 높이를 쓴다. 과거 v1~v4 연출로 되돌리지 않는다.

작업 폴더는 **D:/tangobook-samples/gagya-song**, 브랜치는 **codex/video-gagya-song**이다. 제작 최종 코드 커밋은 **0a52bf20b**이며 이번 승인 기록은 그 뒤의 문서/영상 보존 커밋이다. main에 통합하거나 push한 것으로 간주하지 않는다. 다른 폴더에서 시작하면 `git worktree list`로 이 위치를 찾는다.

| 수정 목적 | 저장소 루트 기준 위치 |
|---|---|
| 승인/반증/진행 기록 | docs/work/video/tasks/20261015-gagya-song.md |
| 승인 영상 | output/gagya-song-20261015/approved-v5.mp4 |
| 전체 화면·글자·기차 위치/크기 | packages/remotion/src/samples/GagyaSong.tsx |
| 기차 연속 이동 곡선 | packages/remotion/src/samples/trainMotion.ts |
| 음절 경계·원곡·폰트·이미지·실제 Rive | packages/remotion/public/gagya-song-20261015/ |
| Rive 기관차 원본 | output/gagya-song-20261015/rive/scene.rml, rive.yaml |
| Rive 빌드 | scripts/gagya-song/build_assets.py |
| 렌더·원곡 재결합·AV검수 | scripts/gagya-song/render_video.py, verify_video.py |
| 승인본 주행·높이 검수 증거 | output/gagya-song-20261015/revision-v5/ |

재렌더는 실제 작업 폴더에서 `pnpm install --frozen-lockfile` 후 `python scripts/gagya-song/render_video.py --out D:/tangobook-video/gagya-song-next-revision`을 실행한다. **새 출력 폴더를 사용하고 승인본은 덮어쓰지 않는다.** 일반 재렌더는 보존된 자산만 사용하며 운영 API/R2/자격증명이 필요 없다. Node/pnpm·Python(NumPy/Pillow/SciPy/soundfile)·FFmpeg가 필요하며, Rive 변경 시에만 공식 Rive CLI가 필요하다. 첫 렌더는 Remotion 브라우저/Rive WASM 다운로드가 필요할 수 있다. 추가 영상 검수는 OpenCV를 사용한다.

주의: `verify_smooth_motion.mjs`와 `verify_smooth_video.py`는 이번 revision-v5 경로를 읽는다. 새 revision 검사 시 출력 경로를 먼저 바꾼다. 이전 정지 요구를 검사하는 verify_train_timing.py/과거방향의 verify_revision.py는 현재 승인본의 합격 기준이 아니다. 원음 재결합을 빼면 Remotion 직접 오디오 출력의 약43ms 지연이 재발할 수 있다.

다음 세션에 사용할 문장:

> 가갸거 송 승인본 v5를 이어서 작업하자. D:/tangobook-samples/gagya-song의 docs/work/video/tasks/20261015-gagya-song.md와 output/gagya-song-20261015/README.md부터 읽고 approved-v5.mp4를 기준으로 진행해 줘.

## 최신 수정본 v5 — 연속 주행·앞칸 높이

[수정 MP4](D:/tangobook-video/gagya-song-20261015/revision-v5/gagya-song-1080x1920.mp4). 사용자 v4의 정지/출발 반증을 반영해, 단조 C1 Hermite 곡선으로 정지 없이 속도를 이어 간다. 발음 시작 후 최대100ms의 모음 구간을 중앙통과 앵커로 삼아20객차의 통과 시점을 맞췄다. 중앙 글자/원곡/음절 경계는 그대로다.

기관차는64px 내려 객차와 같은 레일 높이로 정렬했다. 객차 전체의 상하 흔들림은 제거하고 바퀴와 연결봉을 이동거리에 함께 연결했다. 실제MP420앵커에서 모든객차왼쪽연속이동·계산위치대비오차최대1px, 기관차두바퀴/객차바퀴바닥1532/1533/1532px 확인. 발음/글자의인간최종평가와구분한다. v4의정지유지검사는현재요구가아니므로이전버전검수로보존한다.

검수명령: `node scripts/gagya-song/verify_smooth_motion.mjs` (위치·속도연속/매frame이동), `python scripts/gagya-song/verify_smooth_video.py` (실제20통과/레일높이). 둘다이번 revision-v5 경로를 사용한다. 기존 v1~v4는보존한다.

## 최신 수정본 v4 — 기차 발음 타이밍

[수정 MP4](D:/tangobook-video/gagya-song-20261015/revision-v4/gagya-song-1080x1920.mp4). v3의 선형 객차 이동이 발음 도중 다음 글자 쪽으로 앞서가던 문제를 수정했다. 현재 발음 객차를 중앙에 유지하고 다음 음절 직전 최대100ms에 이동하여 다음 cue frame에 새 객차가 중앙에 도착한다. 반복 전 객차 글자는 숨기고 마지막 음절을 유지한 후 퇴장한다. 원곡/40음절 경계·기차 낮은 위치·오른쪽→왼쪽·차분한 중앙 글자·입술 없음은 그대로다.

검수는 `verify_train_timing.py`로 두 기차 구간20음절의 실제MP4를 음절당2프레임씩 비교한다. 글자 자체의 작은 기울기는 이동 오차로 세지 않도록 객차의 고정 창틀을 추적한다. 추가 `verify_revision.py --out <출력폴더>`가40경계/실제진행방향/동일frame재현을 확인한다. v1~v3 원본은 보존한다.

## 최신 수정본 v3 — 2026-10-15

[수정 MP4](D:/tangobook-video/gagya-song-20261015/revision-v3/gagya-song-1080x1920.mp4). 사용자가 v2의 날아오는 글자를 불편하다고 반증하여 중앙 글자를 v1 크기330/400px로 복원하고 제자리30px 반동·최대3.5%확대만 적용했다. 원근회전·큰 진입/회전은 제거했다. 입술·하단 텍스트·ㄱ 캐릭터는 화면에서 제거했다.

최신 방향 지시는 **오른쪽→왼쪽**이다. 기관차가 왼쪽을 향하며 객차 글자는 정상 방향으로 읽힌다. 기차를160px 아래로 내려 중심글자와 분리했다. 40음절 타이밍과 원곡은v2그대로 유지한다. 아래v2의왼쪽→오른쪽/입술설명은당시보존기록이며현재출력보다우선하지않는다. v1/v2 MP4는 보존했다.

## 최신 수정본 v2 — 2026-10-15

[수정 MP4](D:/tangobook-video/gagya-song-20261015/revision-v2/gagya-song-1080x1920.mp4), [40음절 표본](revision-v2/phoneme-contact.jpg), [AV 검수](revision-v2/verification.json), [전환·방향 검수](revision-v2/revision-verification.json).

글자를 390/470px로 키우고 음절마다 상하 점프/좌우 질주/회전/원근 뒤집기/탄성 확대를 다르게 적용했다. 하단 ㄱ 캐릭터·작은 ㄱ+모음·마지막 반복 문자열은 제거했다. 기관차·객차·바퀴는 오른쪽으로 진행하며 선로는 고정했다. 4.0→4.1초 실제 기관차 영상 패치가 오른쪽107px 이동(상관0.9956)했다.

기존 onset 40개 순서배정은 폐기했다. 알려진 가사로 Whisper 강제정렬 후 원곡 상관이 확인된 stem0 음향 경계와 대조해 `phoneme-timing.json`에 40개 경계를 동결했다. 반복 첫 가는1.64/4.616/8.128/11.648초 기준이며 네 번째 가의 유지음과 이후 공백을 분리했다. 노래 CTC 정렬은 신뢰도가 낮아 반려했고 채택하지 않았다. 분석 원본은 D경로 revision-v2/alignment.json·combined-alignment.json·ctc-alignment.json에 보존한다. 자동 정렬은 전수 인간 청취를 대신하지 않는다.

입술은 같은 30fps 음절 경계를 사용하며 별도의3프레임 지연을 제거했다. 664개 보컬 음량 표본으로 개폐하여 숨 고르는 공백에 닫힌다. 교정 경계의30fps양자화오차 최대16ms이며, 이 수치는 인간이 측정한 발음오차가 아니다. 모든40음절에서 Rive/Remotion 전환 frame일치, 같은frame110 픽셀차이0, 전체decode/원곡상관0.999278/지연0ms 확인.

현재 Rive는 **Singing mouth / Locomotive 2개 artboard**다. 코드/이미지/원곡은 동일 경로에서 재현하며 아래1차 시안 설명보다 이 절이 우선한다. 새로운 출력 폴더를 지정해 `render_video.py`를 실행한다. 음향 분석을 재수행할 때만 `prepare_timing.py`와 원래 stem0.wav가 필요하다. 일반 재렌더는 저장된 phoneme-timing.json을 사용한다. 추가 검수 `verify_revision.py`는 OpenCV도 필요하며 이번 revision-v2 경로를 읽는다.

## 보존된 1차 시안

- 최종 영상: [1080×1920 MP4](D:/tangobook-video/gagya-song-20261015/gagya-song-1080x1920.mp4)
- 검수: [22표본](D:/tangobook-video/gagya-song-20261015/final-qc/contact-sheet.jpg), [AV·동작 결과](D:/tangobook-video/gagya-song-20261015/final-qc/verification.json)
- 원곡: `packages/remotion/public/gagya-song-20261015/song.mp3`, 22.120초. 최종 영상은 30fps 664frame=22.133초이며 원곡 전체를 보존한다.
- 실제 Rive: `packages/remotion/public/gagya-song-20261015/gagya-song.riv`. 원본은 이 폴더의 rive/scene.rml·rive.yaml·이미지.
- 영상 entry: `packages/remotion/src/samples/GagyaSong.tsx`, composition `GagyaSong`. 제품 Root.tsx와 연결하지 않는다.
- 사용자 요청/후속 지시: [작업 기록](../../docs/work/video/tasks/20261015-gagya-song.md).

## 구성

ㄱ+ㅏ 도입 → 큰 글자와 발음별 입술 → 글자를 실은 객차 → 글자 회전과 입술 → 두 번째 열차 → ㄱ 캐릭터들의 마지막 춤. 가사는 가갸거겨고교구규그기 4회이며 참고 영상의 모음송 가사는 가져오지 않는다. 레퍼런스의 입술과 글자 열차 액션을 새 색/자산으로 재구성했다.

세 Rive artboard: Singing mouth / Locomotive / Dancing giyok. 입술 폭·열림·기울기, 기관차 바퀴·연결봉·증기·차체, ㄱ 얼굴·팔다리를 실제 Rive로 움직인다. Remotion은 가사 표시·글자 회전/스쿼시/점프·객차 이동·바퀴·편집을 담당한다.

## 재현

저장소 실제 worktree에서 실행한다. 운영 서버/자격증명은 필요 없다. Node/pnpm, Python(Pillow·NumPy·SciPy·soundfile), FFmpeg가 필요하다. 원본 Rive를 고칠 때만 Rive CLI가 필요하며 기본 경로는 `%USERPROFILE%/.codex/tools/rive-cli/rive.exe`다.

```powershell
pnpm install --frozen-lockfile
python scripts/gagya-song/build_assets.py
pnpm --filter @tangobook/remotion typecheck
python scripts/gagya-song/render_video.py --out D:/tangobook-video/gagya-song-revision
```

기존 출력 폴더에 덮어쓰지 않는다. render_video.py는 Remotion 원본 렌더 후 원곡을 AAC192k로 다시 결합한다. Remotion 직접 음원 출력에서 관찰된 약42.7ms 지연을 회피하며, 검수는 지연<25ms·상관>0.98을 요구한다. 이번 최종 지연0ms/상관0.999278.

같은 frame110을 두 번 독립 캡처했을 때 최대 픽셀 차이0. Rive verify0오류/0경고·inspect problems[]·타입검사·664frame전체decode·22표본 검수 통과. 검수 JSON의 픽셀 변화는 입술/기차가 실제 변하는 증거이며 미세한 발음별 인간 청취나 사용자 연출 승인을 대신하지 않는다.

음절 cue는 원곡과 상관0.7425/lag0인 ZIP stem0의 onset을 기반으로 배치했다. 별도 보컬 Edit는 원곡과 차이가 있어 전사 문자열을 정답으로 쓰지 않았다. 가사 문자열은 사용자 정정이 기준이다. 다음 피드백에서 세밀한 음절 타이밍과 액션 강도를 조절한다.

새 그림 세 장의 프롬프트·실제 출력 크기·출처는 `packages/remotion/public/gagya-song-20261015/image-prompts.md`, 폰트는 같은 폴더 CAFE24-LICENSE.md/FONT-LICENSE.txt에 보존한다. 로컬 시안이며 main통합/push·배포·외부 게시 없음.
