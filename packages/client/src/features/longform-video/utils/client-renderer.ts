import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg-loader';

export interface RenderManifest {
  scenes: Array<{
    processedClipUrl: string;
    sfxUrl?: string;
    sfxVolume: number;
    sfxOffset?: number;
    ttsUrl?: string;
    ttsOffset?: number;
    clipDuration: number;
    trimStart?: number;
    trimEnd?: number;
  }>;
  bgmUrl?: string;
  bgmVolume: number;
  aspectRatio: string;
}

type ProgressCallback = (progress: number, step: string) => void;

/**
 * 하이브리드 렌더링: 서버에서 전처리된 클립을 받아서
 * 클라이언트에서 concat + 오디오 믹싱만 수행 (re-encode 없음).
 */
export async function renderOnClient(
  manifest: RenderManifest,
  onProgress: ProgressCallback
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const totalScenes = manifest.scenes.length;

  // Phase 1: 전처리된 클립 + 오디오 다운로드 (0~50%)
  onProgress(1, '파일 다운로드 시작');
  await downloadAllFiles(ffmpeg, manifest, (done, total) => {
    onProgress(1 + Math.floor((done / total) * 49), `다운로드 ${done}/${total}`);
  });

  // Phase 2: Concat (50~65%) — stream copy, re-encode 없음
  onProgress(50, '장면 연결 중');
  await concatScenes(ffmpeg, totalScenes);

  // Phase 3: 오디오 믹싱 (65~90%)
  onProgress(65, '오디오 믹싱 중');
  await mixAudioAndEncode(ffmpeg, manifest, totalScenes);

  onProgress(90, '파일 생성 완료');
  const data = await ffmpeg.readFile('final_output.mp4');

  await cleanupFiles(ffmpeg, manifest, totalScenes);

  return data as Uint8Array;
}

// ---------------------------------------------------------------------------
// Phase 1: Download pre-processed clips + audio
// ---------------------------------------------------------------------------

/**
 * R2 public URL → 서버 프록시 URL 변환.
 * pub-xxx.r2.dev는 CORS 미지원이므로 서버를 경유.
 */
function toProxyUrl(r2Url: string): string {
  // https://pub-xxx.r2.dev/some/key.mp4 → /api/r2-proxy?key=some/key.mp4
  const match = r2Url.match(/r2\.dev\/(.+)$/);
  if (match) {
    return `/api/r2-proxy?key=${encodeURIComponent(match[1])}`;
  }
  return r2Url; // 이미 프록시 URL이거나 다른 URL
}

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
    tasks.push({ url: toProxyUrl(scene.processedClipUrl), filename: `scene_${i}.mp4` });
    if (scene.sfxUrl) tasks.push({ url: toProxyUrl(scene.sfxUrl), filename: `sfx_${i}.mp3` });
    if (scene.ttsUrl) tasks.push({ url: toProxyUrl(scene.ttsUrl), filename: `tts_${i}.mp3` });
  });

  if (manifest.bgmUrl) {
    tasks.push({ url: toProxyUrl(manifest.bgmUrl), filename: 'bgm.mp3' });
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
// Phase 2: Concat — stream copy (no re-encode)
// ---------------------------------------------------------------------------

async function concatScenes(ffmpeg: FFmpeg, totalScenes: number): Promise<void> {
  if (totalScenes === 1) {
    // 단일 씬 — 복사만
    const data = await ffmpeg.readFile('scene_0.mp4');
    await ffmpeg.writeFile('concat_video.mp4', data);
    return;
  }

  const lines = Array.from({ length: totalScenes }, (_, i) => `file 'scene_${i}.mp4'`);
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
// Phase 3: Audio mixing (no video re-encode)
// ---------------------------------------------------------------------------

async function mixAudioAndEncode(
  ffmpeg: FFmpeg,
  manifest: RenderManifest,
  totalScenes: number
): Promise<void> {
  // 장면별 시작 오프셋 계산
  const sceneOffsets: number[] = [];
  let accum = 0;
  for (const scene of manifest.scenes) {
    sceneOffsets.push(accum);
    const trimStart = scene.trimStart ?? 0;
    const trimEnd = scene.trimEnd ?? 0;
    accum += scene.clipDuration - trimStart - trimEnd;
  }

  // 오디오 입력 수집
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
      audioInputs.push({
        filename: `sfx_${i}.mp3`,
        delayMs: Math.max(0, Math.round((offset + (scene.sfxOffset ?? 0)) * 1000)),
        volume: scene.sfxVolume / 100,
      });
    }

    if (scene.ttsUrl) {
      audioInputs.push({
        filename: `tts_${i}.mp3`,
        delayMs: Math.max(0, Math.round((offset + (scene.ttsOffset ?? 0) + 0.5) * 1000)),
        volume: 1.0,
      });
    }
  }

  const hasBgm = !!manifest.bgmUrl;
  const hasExtraAudio = audioInputs.length > 0 || hasBgm;

  if (!hasExtraAudio) {
    await ffmpeg.rename('concat_video.mp4', 'final_output.mp4');
    return;
  }

  const args: string[] = ['-i', 'concat_video.mp4'];
  const audioFilterParts: string[] = [];
  const audioLabels: string[] = [];
  let inputIdx = 1;

  // 원본 비디오 오디오 (없을 수 있음 — 서버에서 -an으로 제거)
  // 오디오가 없으면 무음 생성
  audioFilterParts.push(`anullsrc=channel_layout=stereo:sample_rate=44100[silence]`);
  audioLabels.push('[silence]');

  for (const input of audioInputs) {
    args.push('-i', input.filename);
    const label = `a${inputIdx}`;
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
    const vol = manifest.bgmVolume / 100;
    const volumeFilter = vol !== 1.0 ? `volume=${vol.toFixed(2)},` : '';
    audioFilterParts.push(
      `[${inputIdx}:a]${volumeFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[bgm]`
    );
    audioLabels.push('[bgm]');
  }

  // amix
  const mixInputs = audioLabels.join('');
  audioFilterParts.push(
    `${mixInputs}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=2[aout]`
  );

  args.push('-filter_complex', audioFilterParts.join(';'));
  args.push('-map', '0:v', '-map', '[aout]');
  args.push('-c:v', 'copy', '-c:a', 'aac');
  args.push('-shortest', '-y', 'final_output.mp4');

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
    filesToDelete.push(`scene_${i}.mp4`);
    if (manifest.scenes[i].sfxUrl) filesToDelete.push(`sfx_${i}.mp3`);
    if (manifest.scenes[i].ttsUrl) filesToDelete.push(`tts_${i}.mp3`);
  }

  if (manifest.bgmUrl) filesToDelete.push('bgm.mp3');
  filesToDelete.push('concat.txt', 'concat_video.mp4');

  for (const file of filesToDelete) {
    try {
      await ffmpeg.deleteFile(file);
    } catch {
      // ignore
    }
  }
}
