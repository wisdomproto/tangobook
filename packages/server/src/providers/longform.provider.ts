import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/generate_longform.py');

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface LongformRenderOptions {
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
  workDir: string;
  outputPath: string;
}

export interface ProgressInfo {
  progress: number;
  step: string;
}

// Active render processes, keyed by projectId
const activeProcesses = new Map<string, ChildProcess>();

/**
 * Cancel an active render process.
 */
export function cancelRender(projectId: string): boolean {
  const proc = activeProcesses.get(projectId);
  if (proc) {
    proc.kill('SIGTERM');
    activeProcesses.delete(projectId);
    return true;
  }
  return false;
}

/**
 * Python 스크립트(generate_longform.py)를 spawn으로 실행하여 롱폼 영상 생성.
 * JSON을 stdin으로 전달하고, stdout에서 결과를 받음.
 * stderr에서 진행률 JSON lines를 파싱하여 onProgress 콜백 호출.
 */
export async function generateLongform(
  options: LongformRenderOptions,
  onProgress?: (info: ProgressInfo) => void,
  projectId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-u', SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    if (projectId) {
      activeProcesses.set(projectId, proc);
    }

    let stdout = '';
    let stderrBuf = '';
    let timedOut = false;

    // 10분 타임아웃
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      if (projectId) activeProcesses.delete(projectId);
    };

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf-8');
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop() ?? '';
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
      cleanup();

      if (timedOut) {
        reject(
          new Error('롱폼 렌더링 타임아웃 (10분 초과). 장면 수를 줄이거나 해상도를 낮춰보세요.')
        );
        return;
      }

      if (signal === 'SIGTERM') {
        reject(new Error('렌더링이 취소되었습니다.'));
        return;
      }

      if (code !== 0) {
        const reason =
          signal === 'SIGKILL'
            ? '메모리 부족(OOM)으로 프로세스가 강제 종료되었습니다. 장면 수를 줄이거나 해상도를 낮춰보세요.'
            : signal
              ? `시그널 ${signal}로 종료됨`
              : stderrBuf;
        reject(new Error(`롱폼 렌더링 실패 (exit code ${code}, signal ${signal}): ${reason}`));
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
      cleanup();
      reject(new Error(`Python 스크립트 실행 실패: ${err.message}`));
    });

    const jsonData = Buffer.from(JSON.stringify(options), 'utf-8');
    proc.stdin.write(jsonData);
    proc.stdin.end();
  });
}
