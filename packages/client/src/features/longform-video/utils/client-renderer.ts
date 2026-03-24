import type { FFmpeg } from '@ffmpeg/ffmpeg';
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

/**
 * 브라우저에서 FFmpeg.wasm으로 롱폼 영상을 렌더링한다.
 * 4단계: 다운로드 → 장면 처리 → 연결 → 오디오 믹싱
 */
export async function renderOnClient(
  manifest: RenderManifest,
  onProgress: ProgressCallback
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const [w, h] = RESOLUTIONS[manifest.aspectRatio] ?? [1280, 720];
  const totalScenes = manifest.scenes.length;

  // Phase 1: Download all files (0~20%)
  onProgress(1, '파일 다운로드 시작');
  await downloadAllFiles(ffmpeg, manifest, (done, total) => {
    onProgress(1 + Math.floor((done / total) * 19), `다운로드 ${done}/${total}`);
  });

  // Phase 2: Process each scene - trim + subtitle overlay (20~60%)
  for (let i = 0; i < totalScenes; i++) {
    onProgress(20 + Math.floor((i / totalScenes) * 40), `장면 ${i + 1}/${totalScenes} 처리 중`);
    await processScene(ffmpeg, manifest, i, w, h);
  }

  // Phase 3: Concatenate scenes (60~75%)
  onProgress(60, '장면 연결 중');
  await concatScenes(ffmpeg, totalScenes);

  // Phase 4: Audio mixing + final encode (75~90%)
  onProgress(75, '오디오 믹싱 + 최종 인코딩');
  await mixAudioAndEncode(ffmpeg, manifest, totalScenes);

  onProgress(90, '파일 생성 완료');
  const data = await ffmpeg.readFile('final_output.mp4');

  // Clean up virtual FS
  await cleanupFiles(ffmpeg, manifest, totalScenes);

  return data as Uint8Array;
}

// ---------------------------------------------------------------------------
// Phase 1: Download
// ---------------------------------------------------------------------------

async function downloadAllFiles(
  ffmpeg: FFmpeg,
  manifest: RenderManifest,
  onFileProgress: (done: number, total: number) => void
): Promise<void> {
  interface DownloadTask {
    url: string;
    filename: string;
  }

  const tasks: DownloadTask[] = [];

  manifest.scenes.forEach((scene, i) => {
    tasks.push({ url: scene.clipUrl, filename: `scene_${i}.mp4` });
    if (scene.sfxUrl) tasks.push({ url: scene.sfxUrl, filename: `sfx_${i}.mp3` });
    if (scene.ttsUrl) tasks.push({ url: scene.ttsUrl, filename: `tts_${i}.mp3` });
  });

  if (manifest.bgmUrl) {
    tasks.push({ url: manifest.bgmUrl, filename: 'bgm.mp3' });
  }

  let done = 0;
  const total = tasks.length;

  await Promise.all(
    tasks.map(async (task) => {
      const data = await fetchFile(task.url);
      await ffmpeg.writeFile(task.filename, data);
      done++;
      onFileProgress(done, total);
    })
  );
}

// ---------------------------------------------------------------------------
// Phase 2: Process each scene (trim + subtitle overlay)
// ---------------------------------------------------------------------------

async function processScene(
  ffmpeg: FFmpeg,
  manifest: RenderManifest,
  idx: number,
  w: number,
  h: number
): Promise<void> {
  const scene = manifest.scenes[idx];
  const trimStart = scene.trimStart ?? 0;
  const trimEnd = scene.trimEnd ?? 0;
  const duration = scene.clipDuration - trimStart - trimEnd;

  // Render subtitle PNGs and write to FS
  const subImages: Array<{ filename: string; y: number; start: number; end: number }> = [];

  for (let si = 0; si < scene.subtitles.length; si++) {
    const sub = scene.subtitles[si];
    const result = renderSubtitleImage(sub.text, w, manifest.subtitleStyle);
    if (!result) continue;

    const filename = `sub_${idx}_${si}.png`;
    await ffmpeg.writeFile(filename, result.png);

    const y = getSubtitleY(manifest.subtitleStyle.position, h, result.height);
    subImages.push({
      filename,
      y,
      start: sub.startTime,
      end: sub.endTime,
    });
  }

  const args: string[] = [];

  // Input: main clip
  args.push('-i', `scene_${idx}.mp4`);

  // Trim
  if (trimStart > 0) args.push('-ss', trimStart.toFixed(3));
  args.push('-t', duration.toFixed(3));

  if (subImages.length > 0) {
    // Add subtitle PNGs as inputs
    for (const sub of subImages) {
      args.push('-i', sub.filename);
    }

    // Build filter_complex chain
    const filters: string[] = [];
    // Scale base video
    filters.push(`[0:v]scale=${w}:${h}[base]`);

    let prevLabel = 'base';
    subImages.forEach((sub, si) => {
      const inputIdx = si + 1; // subtitle inputs start at index 1
      const outLabel = si === subImages.length - 1 ? 'vout' : `v${si}`;
      const x = `(W-w)/2`;
      const enable = `between(t,${sub.start.toFixed(3)},${sub.end.toFixed(3)})`;
      filters.push(
        `[${prevLabel}][${inputIdx}:v]overlay=${x}:${sub.y}:enable='${enable}'[${outLabel}]`
      );
      prevLabel = outLabel;
    });

    args.push('-filter_complex', filters.join(';'));
    args.push('-map', '[vout]');
    args.push('-map', '0:a?');
    // 자막 overlay는 re-encode 필수
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac');
  } else {
    // 자막 없음 → stream copy (re-encode 없이 즉시 완료)
    args.push('-c', 'copy');
  }

  args.push('-y', `processed_${idx}.mp4`);

  const exitCode = await ffmpeg.exec(args);
  if (exitCode !== 0) {
    throw new Error(`장면 ${idx + 1} 처리 실패 (exit code: ${exitCode})`);
  }

  // Free memory: delete source clip
  await ffmpeg.deleteFile(`scene_${idx}.mp4`);

  // Delete subtitle PNGs
  for (const sub of subImages) {
    await ffmpeg.deleteFile(sub.filename);
  }
}

// ---------------------------------------------------------------------------
// Phase 3: Concatenate scenes
// ---------------------------------------------------------------------------

async function concatScenes(ffmpeg: FFmpeg, totalScenes: number): Promise<void> {
  // Build concat list
  const lines = Array.from({ length: totalScenes }, (_, i) => `file 'processed_${i}.mp4'`);
  await ffmpeg.writeFile('concat.txt', lines.join('\n'));

  const exitCode = await ffmpeg.exec([
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    'concat.txt',
    '-c',
    'copy',
    '-y',
    'concat_video.mp4',
  ]);

  if (exitCode !== 0) {
    throw new Error(`장면 연결 실패 (exit code: ${exitCode})`);
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Audio mixing + final encode
// ---------------------------------------------------------------------------

async function mixAudioAndEncode(
  ffmpeg: FFmpeg,
  manifest: RenderManifest,
  totalScenes: number
): Promise<void> {
  // Calculate scene start offsets in the final timeline
  const sceneOffsets: number[] = [];
  let accum = 0;
  for (const scene of manifest.scenes) {
    sceneOffsets.push(accum);
    const trimStart = scene.trimStart ?? 0;
    const trimEnd = scene.trimEnd ?? 0;
    accum += scene.clipDuration - trimStart - trimEnd;
  }

  // Collect extra audio inputs
  interface AudioInput {
    filename: string;
    delayMs: number;
    volume: number;
  }

  const audioInputs: AudioInput[] = [];

  for (let i = 0; i < totalScenes; i++) {
    const scene = manifest.scenes[i];
    const offset = sceneOffsets[i];

    if (scene.sfxUrl) {
      const sfxDelay = (offset + (scene.sfxOffset ?? 0)) * 1000;
      audioInputs.push({
        filename: `sfx_${i}.mp3`,
        delayMs: Math.max(0, Math.round(sfxDelay)),
        volume: scene.sfxVolume,
      });
    }

    if (scene.ttsUrl) {
      const ttsDelay = (offset + (scene.ttsOffset ?? 0) + 0.5) * 1000;
      audioInputs.push({
        filename: `tts_${i}.mp3`,
        delayMs: Math.max(0, Math.round(ttsDelay)),
        volume: 1.0,
      });
    }
  }

  const hasBgm = !!manifest.bgmUrl;
  const hasExtraAudio = audioInputs.length > 0 || hasBgm;

  if (!hasExtraAudio) {
    // No extra audio — just rename concat to final
    await ffmpeg.rename('concat_video.mp4', 'final_output.mp4');
    return;
  }

  const args: string[] = [];

  // Input 0: concatenated video
  args.push('-i', 'concat_video.mp4');

  // Additional audio inputs (1-based index after concat_video)
  let inputIdx = 1;
  const audioFilterParts: string[] = [];
  const audioLabels: string[] = [];

  // Original video audio (optional)
  audioLabels.push('[0:a]');
  audioFilterParts.push(
    `[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[orig]`
  );
  audioLabels[0] = '[orig]';

  for (let ai = 0; ai < audioInputs.length; ai++) {
    const input = audioInputs[ai];
    args.push('-i', input.filename);

    const label = `a${ai}`;
    const delayFilter = input.delayMs > 0 ? `adelay=${input.delayMs}|${input.delayMs},` : '';
    const volumeFilter = input.volume !== 1.0 ? `volume=${input.volume.toFixed(2)},` : '';
    audioFilterParts.push(
      `[${inputIdx}:a]${delayFilter}${volumeFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[${label}]`
    );
    audioLabels.push(`[${label}]`);
    inputIdx++;
  }

  if (hasBgm) {
    args.push('-i', 'bgm.mp3');
    const bgmLabel = 'bgm';
    const volumeFilter =
      manifest.bgmVolume !== 1.0 ? `volume=${manifest.bgmVolume.toFixed(2)},` : '';
    audioFilterParts.push(
      `[${inputIdx}:a]${volumeFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[${bgmLabel}]`
    );
    audioLabels.push(`[${bgmLabel}]`);
  }

  // amix all audio tracks
  const mixInputs = audioLabels.join('');
  const nInputs = audioLabels.length;
  audioFilterParts.push(
    `${mixInputs}amix=inputs=${nInputs}:duration=longest:dropout_transition=2[aout]`
  );

  const filterComplex = audioFilterParts.join(';');

  args.push('-filter_complex', filterComplex);
  args.push('-map', '0:v');
  args.push('-map', '[aout]');
  args.push('-c:v', 'copy');
  args.push('-c:a', 'aac');
  args.push('-y', 'final_output.mp4');

  const exitCode = await ffmpeg.exec(args);
  if (exitCode !== 0) {
    throw new Error(`오디오 믹싱 실패 (exit code: ${exitCode})`);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanupFiles(
  ffmpeg: FFmpeg,
  manifest: RenderManifest,
  totalScenes: number
): Promise<void> {
  const filesToDelete: string[] = [];

  for (let i = 0; i < totalScenes; i++) {
    // scene_*.mp4 already deleted in processScene
    filesToDelete.push(`processed_${i}.mp4`);
    if (manifest.scenes[i].sfxUrl) filesToDelete.push(`sfx_${i}.mp3`);
    if (manifest.scenes[i].ttsUrl) filesToDelete.push(`tts_${i}.mp3`);
  }

  if (manifest.bgmUrl) filesToDelete.push('bgm.mp3');
  filesToDelete.push('concat.txt', 'concat_video.mp4', 'final_output.mp4');

  for (const file of filesToDelete) {
    try {
      await ffmpeg.deleteFile(file);
    } catch {
      // File may already be deleted or renamed — ignore
    }
  }
}
