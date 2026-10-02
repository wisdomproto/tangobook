import { videoSubtitleError, type BookVideoFile, type BookVideoFormat } from '@tangobook/shared';

export interface LocalCompositionOptions {
  original: BookVideoFile;
  narration?: BookVideoFile;
  subtitleSrt: string;
  burnSubtitles: boolean;
  mixOriginalAudio: boolean;
  fontSize: number;
  format: BookVideoFormat;
  name: string;
}

function assTime(time: string): string {
  const [h, m, s, ms] = time.split(/[:,]/).map(Number);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(Math.floor(ms / 10)).padStart(2, '0')}`;
}

/** SRT is plain text: never allow its contents to introduce ASS override commands. */
export function makeVideoAss(
  srt: string,
  width: number,
  height: number,
  format: BookVideoFormat,
  fontSize: number
): string {
  const error = videoSubtitleError(srt);
  if (error) throw new Error(error);
  const scale = format === 'long' ? height / 1080 : width / 1080;
  const size = Math.round(fontSize * scale);
  const side = Math.round(width * 0.065);
  const bottom = Math.round(height * (format === 'short' ? 0.17 : 0.065));
  const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${width}\nPlayResY: ${height}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Pretendard,${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(4 * scale))},1,2,${side},${side},${bottom},1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const normalized = srt
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!normalized) return header;
  return (
    header +
    normalized
      .split(/\n\s*\n/)
      .map((cue) => {
        const lines = cue.split('\n');
        const [start, end] = lines[1].split(' --> ');
        const text = lines
          .slice(2)
          .join('\n')
          .replace(/<[^>]*>/g, '')
          .replace(/\\/g, '＼')
          .replace(/{/g, '｛')
          .replace(/}/g, '｝')
          .replace(/\n/g, '\\N');
        return `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${text}`;
      })
      .join('\n') +
    '\n'
  );
}

async function getBytes(url: string, signal: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('합성에 필요한 파일을 불러오지 못했습니다.');
  return new Uint8Array(await response.arrayBuffer());
}
function fileSource(file: BookVideoFile): string {
  return file.key.startsWith('book-videos/')
    ? `/api/r2-proxy?key=${encodeURIComponent(file.key)}`
    : file.url;
}
async function metadata(
  bytes: Uint8Array,
  signal: AbortSignal
): Promise<{ width: number; height: number; duration: number }> {
  const url = URL.createObjectURL(
    new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'video/mp4' })
  );
  const video = document.createElement('video');
  video.preload = 'metadata';
  try {
    return await new Promise((resolve, reject) => {
      const abort = () => finish(new Error('합성을 취소했습니다.'));
      const timeout = setTimeout(
        () => finish(new Error('영상 정보를 읽는 시간이 초과했습니다.')),
        20000
      );
      function finish(error?: Error) {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
        video.onloadedmetadata = null;
        video.onerror = null;
        if (error) reject(error);
        else
          resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
      }
      video.onloadedmetadata = () => finish();
      video.onerror = () => finish(new Error('이 브라우저에서 읽을 수 없는 영상입니다.'));
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
      else video.src = url;
    });
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** All encoding runs in a browser Worker. The server only supplies stored asset bytes. */
export async function composeVideoLocally(
  options: LocalCompositionOptions,
  signal: AbortSignal,
  onProgress: (message: string) => void
): Promise<File> {
  if (options.original.bytes > 512 * 1024 ** 2)
    throw new Error(
      '내 컴퓨터 합성은 512MB 이하 원본을 사용해 주세요. 더 큰 영상은 완성본으로 직접 업로드할 수 있습니다.'
    );
  const error = videoSubtitleError(options.subtitleSrt);
  if (options.burnSubtitles && error) throw new Error(error);
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const ffmpeg = new FFmpeg();
  const blobs: string[] = [];
  const cancel = () => ffmpeg.terminate();
  signal.addEventListener('abort', cancel, { once: true });
  try {
    onProgress('합성 도구와 원본 파일을 준비하고 있습니다.');
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
    const [core, wasm, original] = await Promise.all([
      getBytes(`${base}/ffmpeg-core.js`, signal),
      getBytes(`${base}/ffmpeg-core.wasm`, signal),
      getBytes(fileSource(options.original), signal),
    ]);
    const coreURL = URL.createObjectURL(
      new Blob([core as Uint8Array<ArrayBuffer>], { type: 'text/javascript' })
    );
    const wasmURL = URL.createObjectURL(
      new Blob([wasm as Uint8Array<ArrayBuffer>], { type: 'application/wasm' })
    );
    blobs.push(coreURL, wasmURL);
    await ffmpeg.load({ coreURL, wasmURL });
    signal.throwIfAborted();
    const info = await metadata(original, signal);
    if (!info.width || !info.height || !Number.isFinite(info.duration))
      throw new Error('영상의 크기 또는 길이를 확인할 수 없습니다.');
    await ffmpeg.writeFile('original.mp4', original);
    const args = ['-i', 'original.mp4'];
    if (options.narration) {
      await ffmpeg.writeFile(
        'narration.audio',
        await getBytes(fileSource(options.narration), signal)
      );
      args.push('-i', 'narration.audio');
    }
    if (options.burnSubtitles && options.subtitleSrt.trim()) {
      await ffmpeg.writeFile(
        'Pretendard-Regular.otf',
        await getBytes('/fonts/Pretendard-Regular.otf', signal)
      );
      await ffmpeg.writeFile(
        'captions.ass',
        makeVideoAss(options.subtitleSrt, info.width, info.height, options.format, options.fontSize)
      );
      args.push(
        '-vf',
        'ass=captions.ass:fontsdir=.',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '20',
        '-pix_fmt',
        'yuv420p'
      );
    } else if (options.original.contentType === 'video/webm') {
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20', '-pix_fmt', 'yuv420p');
    } else {
      args.push('-c:v', 'copy');
    }
    if (options.narration && options.mixOriginalAudio) {
      // Probe whether a video audio stream actually exists: silent originals also work.
      let hasAudio = false;
      const log = ({ message }: { message: string }) => {
        if (/Stream #0:\d+.*Audio:/.test(message)) hasAudio = true;
      };
      ffmpeg.on('log', log);
      await ffmpeg.exec(['-i', 'original.mp4', '-t', '0', '-f', 'null', '-']);
      ffmpeg.off('log', log);
      if (hasAudio)
        args.push(
          '-filter_complex',
          '[0:a][1:a]amix=inputs=2:duration=longest:normalize=0,apad[a]',
          '-map',
          '0:v:0',
          '-map',
          '[a]'
        );
      else args.push('-map', '0:v:0', '-map', '1:a:0', '-af', 'apad');
    } else if (options.narration) {
      args.push('-map', '0:v:0', '-map', '1:a:0', '-af', 'apad');
    } else args.push('-map', '0:v:0', '-map', '0:a?');
    args.push(
      '-t',
      String(info.duration),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      '-y',
      'output.mp4'
    );
    ffmpeg.on('progress', ({ progress }) =>
      onProgress(`내 컴퓨터에서 합성 중 · ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`)
    );
    onProgress('내 컴퓨터에서 합성하고 있습니다.');
    const exit = await ffmpeg.exec(args);
    signal.throwIfAborted();
    if (exit !== 0)
      throw new Error('영상 합성에 실패했습니다. 원본 영상과 음원 형식을 확인해 주세요.');
    const data = await ffmpeg.readFile('output.mp4');
    if (typeof data === 'string') throw new Error('완성 영상 데이터를 읽을 수 없습니다.');
    return new File([data as Uint8Array<ArrayBuffer>], options.name, { type: 'video/mp4' });
  } catch (error) {
    if (signal.aborted) throw new Error('합성을 취소했습니다.', { cause: error });
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    ffmpeg.terminate();
    blobs.forEach((url) => URL.revokeObjectURL(url));
  }
}
