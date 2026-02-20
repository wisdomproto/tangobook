import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/generate_audiobook.py');

export interface AudiobookPageData {
  imageUrl: string;
  audioUrl?: string;
  text: string;
  duration?: number;
}

export interface AudiobookOptions {
  pages: AudiobookPageData[];
  cover?: {
    imageUrl: string;
    duration: number;
  };
  format: string;
  aspectRatio: string;
  layout: 'fullscreen' | 'split';
  bgmUrl?: string;
  bgmVolume: number;
  includeSubtitles: boolean;
  subtitleColor: string;
  subtitleSize: 'sm' | 'md' | 'lg';
  subtitlePosition: 'top' | 'center' | 'bottom';
  subtitleBg: string;
  workDir: string;
  outputPath: string;
}

export interface ProgressInfo {
  progress: number;
  step: string;
}

/**
 * Python 스크립트(generate_audiobook.py)를 spawn으로 실행하여 오디오북 생성.
 * JSON을 stdin으로 전달하고, stdout에서 결과를 받음.
 * stderr에서 진행률 JSON lines를 파싱하여 onProgress 콜백 호출.
 */
export async function generateAudiobook(
  options: AudiobookOptions,
  onProgress?: (info: ProgressInfo) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-u', SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderrBuf = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf-8');
      // stderr에서 JSON lines 파싱
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop() ?? ''; // 마지막 불완전한 줄은 버퍼에 유지
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed.progress === 'number' && onProgress) {
            onProgress({ progress: parsed.progress, step: parsed.step ?? '' });
          }
        } catch {
          // JSON이 아닌 stderr 출력은 무시
        }
      }
    });

    proc.on('close', (code, signal) => {
      if (code !== 0) {
        const reason =
          signal === 'SIGKILL'
            ? '메모리 부족(OOM)으로 프로세스가 강제 종료되었습니다. 페이지 수를 줄이거나 해상도를 낮춰보세요.'
            : signal
              ? `시그널 ${signal}로 종료됨`
              : stderrBuf;
        reject(new Error(`오디오북 생성 실패 (exit code ${code}, signal ${signal}): ${reason}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result.outputPath);
      } catch {
        reject(new Error(`Python 스크립트 출력 파싱 실패: ${stdout}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Python 스크립트 실행 실패: ${err.message}`));
    });

    const jsonData = Buffer.from(JSON.stringify(options), 'utf-8');
    proc.stdin.write(jsonData);
    proc.stdin.end();
  });
}
