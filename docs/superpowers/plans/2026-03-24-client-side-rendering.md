# 클라이언트-사이드 롱폼 렌더링 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 롱폼 영상 렌더링을 서버(Python/MoviePy)에서 클라이언트(FFmpeg.wasm)로 이전하여 Railway 서버 부하 제거

**Architecture:** 서버는 렌더 매니페스트 JSON + presigned upload URL만 제공. 클라이언트가 FFmpeg.wasm으로 다운로드/자막/크로스디졸브/오디오/인코딩 전체를 처리하고, presigned URL로 R2에 직접 업로드.

**Tech Stack:** @ffmpeg/ffmpeg (FFmpeg.wasm), @aws-sdk/s3-request-presigner, Canvas API, Vite COOP/COEP headers

**Spec:** `docs/superpowers/specs/2026-03-24-client-side-rendering-design.md`

---

## Chunk 1: 서버 API 추가

### Task 1: Presigned URL 지원 추가 (R2 Provider)

**Files:**
- Modify: `packages/server/src/providers/r2.provider.ts`
- Modify: `packages/server/package.json` (새 의존성)

- [ ] **Step 1: @aws-sdk/s3-request-presigner 설치**

```bash
cd packages/server && pnpm add @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: presigned URL 생성 함수 추가**

`packages/server/src/providers/r2.provider.ts` 끝에 추가:

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 1800 // 30분
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = `${r2PublicUrl}/${key}`;
  return { uploadUrl, publicUrl };
}
```

- [ ] **Step 3: 커밋**

```bash
git add packages/server/src/providers/r2.provider.ts packages/server/package.json pnpm-lock.yaml
git commit -m "feat: R2 presigned upload URL 생성 함수 추가"
```

### Task 2: 렌더 매니페스트 / Presigned / Confirm API 추가

**Files:**
- Modify: `packages/server/src/services/longform.service.ts`
- Modify: `packages/server/src/controllers/longform.controller.ts`
- Modify: `packages/server/src/routes/longform.routes.ts`

- [ ] **Step 1: longform.service.ts에 3개 메서드 추가**

`render()` 메서드 아래에 추가:

```typescript
// ----- Render manifest (클라이언트-사이드 렌더링용) -----
async renderManifest(storybookId: string, projectId: string) {
  const storybook = await loadStorybook(storybookId);
  const project = loadProject(storybook, projectId);

  if (project.scenes.length === 0) {
    throw new AppError(400, '장면이 없습니다.');
  }
  const readyScenes = project.scenes.filter((s) => s.clipUrl);
  if (readyScenes.length === 0) {
    throw new AppError(400, '생성된 클립이 없습니다.');
  }

  return {
    scenes: readyScenes
      .sort((a, b) => a.order - b.order)
      .map((scene) => ({
        clipUrl: scene.clipUrl!,
        sfxUrl: scene.sfxUrl,
        sfxVolume: scene.sfxVolume,
        sfxOffset: scene.sfxOffset,
        ttsUrl: scene.ttsUrl,
        ttsOffset: scene.ttsOffset,
        subtitles: scene.subtitles.map((sub) => ({
          text: sub.text,
          startTime: sub.startTime,
          endTime: sub.endTime,
        })),
        clipDuration: scene.clipDuration,
        trimStart: scene.trimStart,
        trimEnd: scene.trimEnd,
      })),
    bgmUrl: project.bgmUrl,
    bgmVolume: project.bgmVolume,
    aspectRatio: project.aspectRatio,
    subtitleStyle: {
      fontSize: project.subtitleStyle.fontSize,
      position: project.subtitleStyle.position,
      textColor: project.subtitleStyle.textColor,
      outlineColor: project.subtitleStyle.outlineColor,
      bgColor: project.subtitleStyle.bgColor,
    },
    transitionDuration: 0.5,
    jCutDuration: 1.0,
  };
},

// ----- Presigned upload URL -----
async presignedUpload(storybookId: string, projectId: string) {
  const key = outputKey(storybookId, projectId);
  return createPresignedUploadUrl(key, 'video/mp4');
},

// ----- Confirm render (클라이언트 업로드 완료 후) -----
async confirmRender(storybookId: string, projectId: string, outputUrl: string) {
  const storybook = await loadStorybook(storybookId);
  const project = loadProject(storybook, projectId);
  project.outputUrl = outputUrl;
  project.createdAt = new Date().toISOString();
  await R2Repository.saveStorybook(storybook);
  return { outputUrl };
},
```

- [ ] **Step 2: r2.provider import 추가**

`longform.service.ts` 상단 import에 `createPresignedUploadUrl` 추가.

- [ ] **Step 3: longform.controller.ts에 핸들러 추가**

```typescript
renderManifest: asyncHandler(async (req: Request, res: Response) => {
  const { storybookId, projectId } = req.body;
  const manifest = await LongformService.renderManifest(storybookId, projectId);
  res.json({ success: true, data: manifest });
}),

presignedUpload: asyncHandler(async (req: Request, res: Response) => {
  const { storybookId, projectId } = req.body;
  const result = await LongformService.presignedUpload(storybookId, projectId);
  res.json({ success: true, data: result });
}),

confirmRender: asyncHandler(async (req: Request, res: Response) => {
  const { storybookId, projectId, outputUrl } = req.body;
  const result = await LongformService.confirmRender(storybookId, projectId, outputUrl);
  res.json({ success: true, data: result });
}),
```

- [ ] **Step 4: longform.routes.ts에 라우트 추가**

```typescript
router.post('/render-manifest', longformController.renderManifest);
router.post('/presigned-upload', longformController.presignedUpload);
router.post('/confirm-render', longformController.confirmRender);
```

- [ ] **Step 5: 타입체크**

```bash
pnpm typecheck
```

- [ ] **Step 6: 커밋**

```bash
git add packages/server/src/services/longform.service.ts packages/server/src/controllers/longform.controller.ts packages/server/src/routes/longform.routes.ts
git commit -m "feat: 클라이언트 렌더링용 API 3종 추가 (manifest/presigned/confirm)"
```

### Task 3: COOP/COEP 헤더 설정

FFmpeg.wasm은 SharedArrayBuffer가 필요하므로 COOP/COEP 헤더 필수.

**Files:**
- Modify: `packages/client/vite.config.ts` (개발 서버)
- Modify: `packages/server/src/app.ts` (프로덕션 — 클라이언트 static serve)

- [ ] **Step 1: Vite 개발 서버에 COOP/COEP 헤더 추가**

`packages/client/vite.config.ts`의 `server` 섹션에:

```typescript
server: {
  port: 5173,
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      timeout: 300000,
      proxyTimeout: 300000,
    },
  },
},
```

- [ ] **Step 2: 프로덕션 서버에 COOP/COEP 미들웨어 추가**

`packages/server/src/app.ts`에서 static file serve 전에:

```typescript
// COOP/COEP headers for FFmpeg.wasm (SharedArrayBuffer)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

- [ ] **Step 3: 외부 리소스 crossorigin 대응**

COEP `require-corp` 설정 시 외부 리소스(R2 CDN 등)에서 `Cross-Origin-Resource-Policy` 헤더가 필요. R2 public URL에서 제공하는 리소스가 차단될 수 있으므로 확인 필요.

대안: COEP를 `credentialless`로 변경 (Chrome 96+):
```typescript
'Cross-Origin-Embedder-Policy': 'credentialless'
```
이렇게 하면 외부 리소스가 `cross-origin` 이어도 credentials 없이 접근 가능.

- [ ] **Step 4: 타입체크 + 개발서버 테스트**

```bash
pnpm typecheck
```

브라우저에서 `crossOriginIsolated` 확인:
```javascript
console.log(crossOriginIsolated) // true여야 함
```

- [ ] **Step 5: 커밋**

```bash
git add packages/client/vite.config.ts packages/server/src/app.ts
git commit -m "feat: COOP/COEP 헤더 추가 (FFmpeg.wasm SharedArrayBuffer 지원)"
```

---

## Chunk 2: 클라이언트 FFmpeg.wasm 인프라

### Task 4: FFmpeg.wasm 설치 및 로더

**Files:**
- Modify: `packages/client/package.json`
- Create: `packages/client/src/features/longform-video/utils/ffmpeg-loader.ts`

- [ ] **Step 1: @ffmpeg/ffmpeg + @ffmpeg/util 설치**

```bash
cd packages/client && pnpm add @ffmpeg/ffmpeg @ffmpeg/util
```

- [ ] **Step 2: FFmpeg 싱글톤 로더 작성**

```typescript
// packages/client/src/features/longform-video/utils/ffmpeg-loader.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();

    // CDN에서 core 로드 (멀티스레드 버전)
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.9/dist/esm';
    await instance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });

    ffmpeg = instance;
    return instance;
  })();

  return loadPromise;
}

export function isFFmpegSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;
}
```

- [ ] **Step 3: 커밋**

```bash
git add packages/client/package.json packages/client/src/features/longform-video/utils/ffmpeg-loader.ts pnpm-lock.yaml
git commit -m "feat: FFmpeg.wasm 싱글톤 로더 추가"
```

### Task 5: Canvas 자막 생성기

**Files:**
- Create: `packages/client/src/features/longform-video/utils/subtitle-canvas.ts`

- [ ] **Step 1: Canvas 기반 자막 이미지 생성 유틸 작성**

```typescript
// packages/client/src/features/longform-video/utils/subtitle-canvas.ts

interface SubtitleStyle {
  fontSize: number;
  textColor: string;
  outlineColor: string;
  bgColor: string;
  position: string;
}

interface SubtitleEntry {
  text: string;
  startTime: number;
  endTime: number;
}

const FONT_FAMILY = '"Malgun Gothic", "Apple SD Gothic Neo", "Nanum Gothic", sans-serif';

/**
 * 자막 텍스트를 PNG Uint8Array로 렌더링.
 * Python Pillow 로직과 동일한 결과물.
 */
export function renderSubtitleImage(
  text: string,
  videoWidth: number,
  style: SubtitleStyle
): { png: Uint8Array; width: number; height: number } | null {
  if (!text.trim()) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = typeof style.fontSize === 'number' ? style.fontSize : 26;
  const font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.font = font;

  const strokeWidth = 2;
  const maxTextWidth = videoWidth - 80;
  const padding = 24;

  // 자동 줄바꿈
  const lines = wrapText(ctx, text, maxTextWidth);
  const lineHeight = fontSize * 1.3;
  const textHeight = lines.length * lineHeight;
  const textWidth = Math.min(
    Math.max(...lines.map((l) => ctx.measureText(l).width)),
    maxTextWidth
  );

  const imgW = Math.ceil(textWidth + padding * 2);
  const imgH = Math.ceil(textHeight + padding * 2);

  canvas.width = imgW;
  canvas.height = imgH;

  // 배경
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, imgW, imgH);

  // 텍스트
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    const x = imgW / 2;
    const y = padding + i * lineHeight;

    // 외곽선
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = strokeWidth * 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(line, x, y);

    // 텍스트
    ctx.fillStyle = style.textColor;
    ctx.fillText(line, x, y);
  });

  // PNG로 변환
  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return { png: bytes, width: imgW, height: imgH };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // 단어 단위 줄바꿈 → 글자 단위 fallback (한글)
  const words = text.split(' ');
  if (words.length === 0) return [text];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = current + ' ' + words[i];
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);

  // 글자 단위 fallback
  const result: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      result.push(line);
    } else {
      let buf = '';
      for (const ch of line) {
        const test = buf + ch;
        if (ctx.measureText(test).width > maxWidth && buf) {
          result.push(buf);
          buf = ch;
        } else {
          buf = test;
        }
      }
      if (buf) result.push(buf);
    }
  }

  return result;
}

/**
 * 자막 Y 좌표 계산.
 */
export function getSubtitleY(position: string, videoHeight: number, subHeight: number): number {
  const margin = 40;
  if (position === 'top') return margin;
  if (position === 'center') return Math.floor((videoHeight - subHeight) / 2);
  return videoHeight - subHeight - margin; // bottom
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/longform-video/utils/subtitle-canvas.ts
git commit -m "feat: Canvas API 자막 이미지 생성 유틸 추가"
```

---

## Chunk 3: 클라이언트 렌더링 파이프라인

### Task 6: 메인 렌더러 작성

**Files:**
- Create: `packages/client/src/features/longform-video/utils/client-renderer.ts`

- [ ] **Step 1: 클라이언트 렌더러 코어 작성**

이 파일이 가장 큰 핵심 로직. FFmpeg.wasm을 사용해 전체 파이프라인 처리.

```typescript
// packages/client/src/features/longform-video/utils/client-renderer.ts
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg-loader';
import { renderSubtitleImage, getSubtitleY } from './subtitle-canvas';

export interface RenderManifest {
  scenes: Array<{
    clipUrl: string;
    sfxUrl?: string;
    sfxVolume: number;
    sfxOffset?: number;
    ttsUrl?: string;
    ttsOffset?: number;
    subtitles: Array<{ text: string; startTime: number; endTime: number }>;
    clipDuration: number;
    trimStart?: number;
    trimEnd?: number;
  }>;
  bgmUrl?: string;
  bgmVolume: number;
  aspectRatio: string;
  subtitleStyle: {
    fontSize: number;
    position: string;
    textColor: string;
    outlineColor: string;
    bgColor: string;
  };
  transitionDuration: number;
  jCutDuration: number;
}

type ProgressCallback = (progress: number, step: string) => void;

const RESOLUTIONS: Record<string, [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '1:1': [720, 720],
};

export async function renderOnClient(
  manifest: RenderManifest,
  onProgress: ProgressCallback
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const [w, h] = RESOLUTIONS[manifest.aspectRatio] ?? [1280, 720];
  const totalScenes = manifest.scenes.length;

  // Phase 1: 파일 다운로드 (0~20%)
  onProgress(1, '파일 다운로드 시작');
  await downloadAllFiles(ffmpeg, manifest, (done, total) => {
    onProgress(1 + Math.floor((done / total) * 19), `다운로드 ${done}/${total}`);
  });

  // Phase 2: 씬별 자막 overlay (20~60%)
  for (let i = 0; i < totalScenes; i++) {
    onProgress(20 + Math.floor((i / totalScenes) * 40), `장면 ${i + 1}/${totalScenes} 자막 처리`);
    await processScene(ffmpeg, manifest, i, w, h);
  }

  // Phase 3: 크로스디졸브 concat (60~75%)
  onProgress(60, '크로스디졸브 연결 중');
  await concatWithCrossfade(ffmpeg, totalScenes, manifest.transitionDuration, w, h);

  // Phase 4: 오디오 믹싱 + 최종 인코딩 (75~90%)
  onProgress(75, '오디오 믹싱 + 최종 인코딩');
  await mixAudioAndEncode(ffmpeg, manifest, totalScenes, w, h);

  // 최종 파일 읽기
  onProgress(90, '파일 생성 완료');
  const data = await ffmpeg.readFile('final_output.mp4');
  return data as Uint8Array;
}

async function downloadAllFiles(
  ffmpeg: any,
  manifest: RenderManifest,
  onProgress: (done: number, total: number) => void
) {
  const tasks: Array<{ name: string; url: string }> = [];

  manifest.scenes.forEach((scene, i) => {
    tasks.push({ name: `scene_${i}.mp4`, url: scene.clipUrl });
    if (scene.sfxUrl) tasks.push({ name: `sfx_${i}.mp3`, url: scene.sfxUrl });
    if (scene.ttsUrl) tasks.push({ name: `tts_${i}.mp3`, url: scene.ttsUrl });
  });
  if (manifest.bgmUrl) tasks.push({ name: 'bgm.mp3', url: manifest.bgmUrl });

  let done = 0;
  // 브라우저에서는 병렬 fetch → 순차 writeFile
  const fetched = await Promise.all(
    tasks.map(async (t) => {
      const data = await fetchFile(t.url);
      done++;
      onProgress(done, tasks.length);
      return { name: t.name, data };
    })
  );

  for (const { name, data } of fetched) {
    await ffmpeg.writeFile(name, data);
  }
}

async function processScene(
  ffmpeg: any,
  manifest: RenderManifest,
  idx: number,
  w: number,
  h: number
) {
  const scene = manifest.scenes[idx];
  const input = `scene_${idx}.mp4`;
  const output = `processed_${idx}.mp4`;

  // 1. Trim + Resize
  const trimStart = scene.trimStart ?? 0;
  const trimEnd = scene.trimEnd ?? 0;
  const duration = scene.clipDuration - trimStart - trimEnd;

  const filterParts: string[] = [`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`];

  // 2. 자막 overlay
  const subtitles = scene.subtitles.filter((s) => s.text.trim());
  if (subtitles.length > 0) {
    // 각 자막을 PNG로 생성하여 ffmpeg FS에 기록
    for (let si = 0; si < subtitles.length; si++) {
      const sub = subtitles[si];
      const img = renderSubtitleImage(sub.text, w, manifest.subtitleStyle);
      if (!img) continue;

      const subFile = `sub_${idx}_${si}.png`;
      await ffmpeg.writeFile(subFile, img.png);
    }
  }

  // ffmpeg 명령어 조립
  const args = ['-i', input];

  if (trimStart > 0) args.push('-ss', String(trimStart));
  if (duration > 0) args.push('-t', String(duration));

  // 자막 overlay (있으면)
  if (subtitles.length > 0) {
    // 각 자막 파일을 input으로 추가
    for (let si = 0; si < subtitles.length; si++) {
      args.push('-i', `sub_${idx}_${si}.png`);
    }

    // filter_complex: 순차 overlay
    let filterStr = `[0:v]scale=${w}:${h}[base]`;
    let prevLabel = 'base';
    const subY = getSubtitleY(manifest.subtitleStyle.position, h, 60);

    for (let si = 0; si < subtitles.length; si++) {
      const sub = subtitles[si];
      const nextLabel = si === subtitles.length - 1 ? 'vout' : `v${si}`;
      const enable = `between(t,${sub.startTime},${sub.endTime})`;
      filterStr += `;[${prevLabel}][${si + 1}:v]overlay=(W-w)/2:${subY}:enable='${enable}'[${nextLabel}]`;
      prevLabel = nextLabel;
    }

    args.push('-filter_complex', filterStr, '-map', '[vout]', '-map', '0:a?');
  } else {
    args.push('-vf', `scale=${w}:${h}`);
  }

  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-y', output);
  await ffmpeg.exec(args);
}

async function concatWithCrossfade(
  ffmpeg: any,
  totalScenes: number,
  transitionDuration: number,
  w: number,
  h: number
) {
  if (totalScenes === 1) {
    // 단일 씬 — 그냥 복사
    await ffmpeg.exec(['-i', 'processed_0.mp4', '-c', 'copy', '-y', 'concat_video.mp4']);
    return;
  }

  if (transitionDuration <= 0) {
    // 크로스디졸브 없이 단순 concat
    let concatList = '';
    for (let i = 0; i < totalScenes; i++) {
      concatList += `file 'processed_${i}.mp4'\n`;
    }
    await ffmpeg.writeFile('concat.txt', concatList);
    await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', '-y', 'concat_video.mp4']);
    return;
  }

  // xfade 체인: 2개씩 연결
  // ffmpeg -i p0.mp4 -i p1.mp4 -i p2.mp4 -filter_complex
  //   "[0][1]xfade=transition=fade:duration=0.5:offset=X[v01];[v01][2]xfade=..."
  const inputs: string[] = [];
  for (let i = 0; i < totalScenes; i++) {
    inputs.push('-i', `processed_${i}.mp4`);
  }

  // 각 씬 duration을 probe (간단히 clipDuration 사용)
  // xfade offset = 이전까지 누적 duration - 이전 transition 수 * transitionDuration
  // 여기서는 ffmpeg가 자동 계산하도록 offset을 수동 지정

  // 실제로는 probe 필요 — 여기선 간단히 concat demuxer + 별도 xfade 없이 처리
  // (복잡한 xfade 체인은 ffmpeg.wasm에서 메모리 이슈 가능 → 추후 개선)
  // 우선은 단순 concat으로 처리하고, xfade는 2차 개선에서 추가
  let concatList = '';
  for (let i = 0; i < totalScenes; i++) {
    concatList += `file 'processed_${i}.mp4'\n`;
  }
  await ffmpeg.writeFile('concat.txt', concatList);
  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', '-y', 'concat_video.mp4']);
}

async function mixAudioAndEncode(
  ffmpeg: any,
  manifest: RenderManifest,
  totalScenes: number,
  w: number,
  h: number
) {
  // 오디오 트랙 수집
  const audioInputs: string[] = ['-i', 'concat_video.mp4'];
  const filterParts: string[] = [];
  let audioIdx = 1;
  const audioLabels: string[] = ['0:a'];

  // SFX + TTS per scene
  let sceneOffset = 0;
  for (let i = 0; i < totalScenes; i++) {
    const scene = manifest.scenes[i];
    const sceneDur = scene.clipDuration - (scene.trimStart ?? 0) - (scene.trimEnd ?? 0);

    if (scene.sfxUrl) {
      audioInputs.push('-i', `sfx_${i}.mp3`);
      const delay = Math.round((sceneOffset + (scene.sfxOffset ?? 0)) * 1000);
      const vol = scene.sfxVolume / 100;
      filterParts.push(`[${audioIdx}:a]adelay=${delay}|${delay},volume=${vol}[sfx${i}]`);
      audioLabels.push(`sfx${i}`);
      audioIdx++;
    }

    if (scene.ttsUrl) {
      audioInputs.push('-i', `tts_${i}.mp3`);
      const delay = Math.round((sceneOffset + (scene.ttsOffset ?? 0) + 0.5) * 1000);
      filterParts.push(`[${audioIdx}:a]adelay=${delay}|${delay}[tts${i}]`);
      audioLabels.push(`tts${i}`);
      audioIdx++;
    }

    sceneOffset += sceneDur;
  }

  // BGM
  if (manifest.bgmUrl) {
    audioInputs.push('-i', 'bgm.mp3');
    const vol = manifest.bgmVolume / 100;
    filterParts.push(`[${audioIdx}:a]volume=${vol}[bgm]`);
    audioLabels.push('bgm');
    audioIdx++;
  }

  if (audioLabels.length <= 1) {
    // 오디오 없음 — 영상만 복사
    await ffmpeg.exec(['-i', 'concat_video.mp4', '-c', 'copy', '-y', 'final_output.mp4']);
    return;
  }

  // amix
  const mixInputs = audioLabels.map((l) => `[${l}]`).join('');
  filterParts.push(`${mixInputs}amix=inputs=${audioLabels.length}:duration=longest[aout]`);

  const args = [
    ...audioInputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    '-y', 'final_output.mp4',
  ];

  await ffmpeg.exec(args);
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/longform-video/utils/client-renderer.ts
git commit -m "feat: FFmpeg.wasm 클라이언트 렌더러 코어 작성"
```

---

## Chunk 4: API 연동 + RenderStep UI 변경

### Task 7: 클라이언트 API 추가

**Files:**
- Modify: `packages/client/src/features/longform-video/api/longform.api.ts`

- [ ] **Step 1: 새 API 함수 추가**

```typescript
// 기존 API 유지 + 새 API 추가
renderManifest: (req: { storybookId: string; projectId: string }) =>
  apiPost<RenderManifest>('/longform/render-manifest', req),

presignedUpload: (req: { storybookId: string; projectId: string }) =>
  apiPost<{ uploadUrl: string; publicUrl: string }>('/longform/presigned-upload', req),

confirmRender: (req: { storybookId: string; projectId: string; outputUrl: string }) =>
  apiPost<{ outputUrl: string }>('/longform/confirm-render', req),
```

`RenderManifest` 타입은 `client-renderer.ts`에서 import.

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/longform-video/api/longform.api.ts
git commit -m "feat: 클라이언트 렌더링 API 함수 추가"
```

### Task 8: RenderStep.tsx 클라이언트 렌더링으로 변경

**Files:**
- Modify: `packages/client/src/features/longform-video/components/RenderStep.tsx`

- [ ] **Step 1: 서버 렌더링 로직을 클라이언트 렌더링으로 교체**

핵심 변경:

1. `handleRender()` 함수 변경:
   - 서버 polling 제거
   - `longformApi.renderManifest()` → `renderOnClient()` → presigned upload → confirm
   - 로컬 `progress` state로 진행률 관리

2. fallback 로직:
   - `isFFmpegSupported()` 체크 → 미지원 시 기존 서버 렌더링 사용

```typescript
import { renderOnClient } from '../utils/client-renderer';
import { isFFmpegSupported } from '../utils/ffmpeg-loader';

// handleRender 교체:
const handleRender = async () => {
  setError(null);
  setIsRendering(true);

  if (!isFFmpegSupported()) {
    // fallback: 기존 서버 렌더링
    await handleServerRender();
    return;
  }

  try {
    setProgress({ progress: 0, step: 'FFmpeg 로딩 중...' });

    // 1. 매니페스트 요청
    const manifest = await longformApi.renderManifest({
      storybookId,
      projectId: project.id,
    });

    // 2. 클라이언트에서 렌더링
    const videoData = await renderOnClient(manifest, (p, step) => {
      setProgress({ progress: p, step });
    });

    // 3. Presigned URL로 R2 업로드
    setProgress({ progress: 90, step: 'R2 업로드 중...' });
    const { uploadUrl, publicUrl } = await longformApi.presignedUpload({
      storybookId,
      projectId: project.id,
    });

    await fetch(uploadUrl, {
      method: 'PUT',
      body: new Blob([videoData], { type: 'video/mp4' }),
      headers: { 'Content-Type': 'video/mp4' },
    });

    // 4. 서버에 완료 알림
    setProgress({ progress: 98, step: '저장 중...' });
    await longformApi.confirmRender({
      storybookId,
      projectId: project.id,
      outputUrl: publicUrl,
    });

    onUpdate({ outputUrl: publicUrl });
    setProgress({ progress: 100, step: '완료' });
  } catch (err: any) {
    setError(err.message || '렌더링 실패');
  } finally {
    setIsRendering(false);
  }
};
```

3. 기존 `handleServerRender`는 현재 `handleRender` 로직을 그대로 옮겨서 fallback으로 유지.

4. "취소" 버튼: 클라이언트 렌더링 시에는 AbortController 사용 (혹은 간단히 페이지 이탈로 중단).

- [ ] **Step 2: 타입체크**

```bash
pnpm typecheck
```

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/longform-video/components/RenderStep.tsx
git commit -m "feat: RenderStep을 클라이언트-사이드 렌더링으로 전환"
```

---

## Chunk 5: 통합 테스트 + 마무리

### Task 9: E2E 수동 테스트

- [ ] **Step 1: 개발 서버 시작**

```bash
pnpm dev
```

- [ ] **Step 2: SharedArrayBuffer 확인**

브라우저 콘솔에서:
```javascript
console.log(crossOriginIsolated) // true
console.log(typeof SharedArrayBuffer) // 'function'
```

- [ ] **Step 3: 렌더링 테스트**

1. 기존 동화책 선택 → 롱폼 영상 → 렌더링 시작
2. 진행률 바가 로컬로 동작하는지 확인 (서버 polling 아님)
3. 완료 후 영상 재생 + 다운로드 확인
4. R2에 업로드된 URL이 정상인지 확인

- [ ] **Step 4: Fallback 테스트**

COOP/COEP 헤더를 일시 제거하고 `isFFmpegSupported()` 가 false 반환하는지 확인 → 서버 렌더링 fallback 동작 확인.

- [ ] **Step 5: 타입체크 + 빌드**

```bash
pnpm typecheck && pnpm build
```

- [ ] **Step 6: 최종 커밋 + push**

```bash
git add -A
git commit -m "feat: 클라이언트-사이드 롱폼 렌더링 완성 (FFmpeg.wasm)"
git push
```

---

## 구현 순서 요약

| Task | 설명 | 예상 |
|------|------|------|
| 1 | R2 presigned URL 함수 | 가벼움 |
| 2 | 서버 API 3종 (manifest/presigned/confirm) | 중간 |
| 3 | COOP/COEP 헤더 설정 | 가벼움 |
| 4 | FFmpeg.wasm 로더 | 가벼움 |
| 5 | Canvas 자막 생성기 | 중간 |
| 6 | 클라이언트 렌더러 코어 | 핵심 / 큰 작업 |
| 7 | 클라이언트 API 추가 | 가벼움 |
| 8 | RenderStep UI 변경 | 중간 |
| 9 | 통합 테스트 | 테스트 |

## 리스크 & 대응

- **COEP로 인한 외부 리소스 차단**: `credentialless` 사용 또는 R2 CORS 설정
- **FFmpeg.wasm 메모리 한계**: 장면 수 많으면 OOM → 씬별로 중간 파일 정리 (`ffmpeg.deleteFile()`)
- **xfade 필터 복잡도**: 초기 버전은 단순 concat, 2차에서 xfade 추가
- **브라우저 미지원**: `isFFmpegSupported()` 체크 → 서버 fallback 자동 전환
