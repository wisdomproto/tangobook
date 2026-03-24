# 클라이언트-사이드 롱폼 렌더링 설계

## 배경

Railway 서버의 CPU 제약으로 MoviePy 기반 서버-사이드 렌더링이 매우 느림 (50분+). 인코딩을 사용자 브라우저로 이전하여 서버 부하를 제거하고 렌더링 속도를 개선.

## 아키텍처 변경

**현재**: Client → Server → Python(MoviePy) → R2 업로드
**변경**: Client → FFmpeg.wasm(브라우저) → Presigned URL → R2 직접 업로드

## 서버 API 변경

### 새 API

1. `POST /api/longform/render-manifest`
   - Request: `{ storybookId, projectId }`
   - Response: 렌더 매니페스트 JSON (씬별 clipUrl, subtitles, audio, timing 등)
   - 기존 LongformRenderOptions 구조와 동일하되 workDir/outputPath 제외

2. `POST /api/longform/presigned-upload`
   - Request: `{ storybookId, projectId }`
   - Response: `{ uploadUrl, publicUrl, key }` (R2 presigned PUT URL)

3. `POST /api/longform/confirm-render`
   - Request: `{ storybookId, projectId, outputUrl }`
   - storybook에 outputUrl 저장

### 기존 API 유지 (하위호환)

- `POST /render`, `GET /render-progress/:id`, `POST /cancel-render` — 삭제하지 않음
- Python 스크립트 `generate_longform.py` — fallback용으로 보존

## 클라이언트 렌더링 파이프라인

```
1. 렌더 매니페스트 요청 (서버 → JSON)
2. FFmpeg.wasm 로드 (lazy, 첫 렌더링 시 ~31MB)
3. 씬 클립 다운로드 (fetch, 병렬)
4. 씬별 처리:
   a. trim (trimStart/trimEnd) — ffmpeg -ss/-to
   b. Canvas API로 자막 PNG 생성 (시스템 한글 폰트)
   c. ffmpeg overlay 필터로 자막 burn-in
5. 크로스디졸브 concat — ffmpeg xfade 필터 (0.5초)
6. 오디오 믹싱:
   a. SFX: 볼륨 조절 + 오프셋
   b. TTS: 오프셋 + 0.5초 딜레이
   c. J-Cut: 다음 씬 오디오를 이전 씬 끝 1초 전에 시작, fade-in
   d. BGM: 루프 + 볼륨
7. 최종 인코딩 (libx264, ultrafast, 24fps)
8. Presigned URL로 R2 직접 업로드
9. 서버에 confirm-render 요청 (outputUrl 저장)
```

## 자막 렌더링 (Canvas API)

현재 Python Pillow와 동일한 로직을 Canvas API로 포팅:
- 자동 줄바꿈 (단어 단위 + 한글 글자 단위 fallback)
- 텍스트 외곽선 (strokeText)
- 반투명 배경
- top/center/bottom 위치
- 시스템 폰트 사용 (Malgun Gothic, Apple SD Gothic Neo 등)
- PNG로 export → ffmpeg에 overlay input으로 전달

## 크로스디졸브 + J-Cut (ffmpeg 필터)

### 크로스디졸브
```
ffmpeg -i scene0.mp4 -i scene1.mp4 -filter_complex "xfade=transition=fade:duration=0.5:offset=X"
```
- 2개 이상 씬: 체인으로 연결

### J-Cut
```
-filter_complex "
  [0:a]adelay=0|0[a0];
  [1:a]adelay=T|T,afade=t=in:d=1.0[a1];
  [a0][a1]amix=inputs=2[aout]
"
```
- 다음 씬 오디오를 `scene_start - 1.0초`부터 fade-in

## 진행률 (로컬 상태)

서버 polling 제거. 브라우저 내 상태로 관리:
- 0~20%: 파일 다운로드
- 20~60%: 씬별 자막 overlay
- 60~75%: 크로스디졸브 concat
- 75~90%: 오디오 믹싱 + 최종 인코딩
- 90~100%: R2 업로드

## 파일 구조

```
features/longform-video/
  utils/
    client-renderer.ts       # FFmpeg.wasm 렌더링 메인 파이프라인
    subtitle-canvas.ts       # Canvas API 자막 이미지 생성
    ffmpeg-loader.ts         # FFmpeg.wasm lazy 로딩 싱글톤
  api/longform.api.ts        # 새 API 추가
  components/RenderStep.tsx   # 클라이언트 렌더링 UI로 변경

server/src/
  services/longform.service.ts    # renderManifest(), presignedUpload(), confirmRender()
  controllers/longform.controller.ts  # 새 엔드포인트
  routes/longform.routes.ts           # 새 라우트
```

## R2 Presigned URL

S3 호환 PutObject presigned URL 사용:
- Content-Type: video/mp4
- 만료: 30분
- Key: `storybooks/{storybookId}/longform/{projectId}/output.mp4`
- 클라이언트에서 `fetch(uploadUrl, { method: 'PUT', body: videoBlob })` 로 업로드

## 에러 처리

- FFmpeg.wasm 로드 실패 → 에러 메시지 + "서버 렌더링으로 전환" 버튼 (기존 API 호출)
- 개별 씬 다운로드 실패 → 해당 씬 건너뛰기 + 경고
- 인코딩 실패 → 에러 메시지 + 재시도 버튼
- 업로드 실패 → 로컬 다운로드 fallback 제공

## 브라우저 호환성

- FFmpeg.wasm: SharedArrayBuffer 필요 → COOP/COEP 헤더 설정 필요
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- 지원: Chrome 91+, Firefox 79+, Safari 15.2+
- 미지원 브라우저 → 서버 렌더링 fallback
