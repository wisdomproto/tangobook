import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';

export interface VideoGenOptions {
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration?: number;
  imageUrl?: string;
}

export interface VideoGenerationProvider {
  generateClip(prompt: string, options: VideoGenOptions): Promise<Buffer>;
}

// 5 minute timeout per clip
const VIDEO_GENERATION_TIMEOUT_MS = 5 * 60 * 1000;

// Polling interval for async generation
const POLLING_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 60; // 5 min / 5 sec

async function pollForCompletion(
  requestId: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Buffer> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, POLLING_INTERVAL_MS);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new AppError(504, 'Grok 영상 생성 타임아웃'));
      });
    });

    const statusRes = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!statusRes.ok) {
      const errorText = await statusRes.text().catch(() => '');
      throw new AppError(
        statusRes.status,
        `Grok 영상 생성 상태 조회 실패 (${statusRes.status}): ${errorText}`
      );
    }

    const statusData = (await statusRes.json()) as {
      request_id: string;
      status: 'pending' | 'done' | 'expired' | 'failed';
      video?: { url?: string };
      error?: string;
    };

    console.log(`[grok] poll #${attempt + 1} status=${statusData.status}`);

    if (statusData.status === 'failed') {
      throw new AppError(500, `Grok 영상 생성 실패: ${statusData.error ?? 'unknown error'}`);
    }

    if (statusData.status === 'expired') {
      throw new AppError(500, 'Grok 영상 생성 만료됨');
    }

    if (statusData.status === 'done') {
      const videoUrl = statusData.video?.url;
      console.log(`[grok] done! videoUrl=${videoUrl?.slice(0, 100)}...`);
      if (!videoUrl) {
        throw new AppError(500, 'Grok 영상 생성 완료 응답에 URL이 없음');
      }

      const videoRes = await fetch(videoUrl, { signal });
      if (!videoRes.ok) {
        throw new AppError(videoRes.status, `Grok 영상 다운로드 실패 (${videoRes.status})`);
      }

      const arrayBuffer = await videoRes.arrayBuffer();
      console.log(`[grok] downloaded video: ${arrayBuffer.byteLength} bytes`);
      return Buffer.from(arrayBuffer);
    }

    // still pending - continue polling
  }

  throw new AppError(504, 'Grok 영상 생성 타임아웃: 최대 폴링 횟수 초과');
}

export const GrokProvider: VideoGenerationProvider = {
  async generateClip(prompt: string, options: VideoGenOptions): Promise<Buffer> {
    const apiKey = config.xai.apiKey;
    if (!apiKey) {
      throw new AppError(500, 'XAI_API_KEY 환경 변수가 설정되지 않았습니다');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VIDEO_GENERATION_TIMEOUT_MS);

    try {
      const requestBody: Record<string, unknown> = {
        model: 'grok-imagine-video',
        prompt,
        aspect_ratio: options.aspectRatio,
        resolution: '720p',
      };

      if (options.duration !== undefined) {
        requestBody.duration = options.duration;
      }

      if (options.imageUrl) {
        // Grok API uses "image": { "url": "..." } for image-to-video
        requestBody.image = { url: encodeURI(options.imageUrl) };
        console.log(`[grok] image reference: ${encodeURI(options.imageUrl).slice(0, 80)}...`);
      }

      console.log(
        '[grok] request body keys:',
        Object.keys(requestBody),
        'has image:',
        !!requestBody.image
      );

      const res = await fetch('https://api.x.ai/v1/videos/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('[grok] API error:', res.status, errorText);
        throw new AppError(res.status, `Grok 영상 생성 요청 실패 (${res.status}): ${errorText}`);
      }

      const data = (await res.json()) as {
        request_id?: string;
        status?: string;
        video?: { url?: string };
      };
      console.log('[grok] initial response:', JSON.stringify(data));

      // Case 1: Synchronous response - video URL returned immediately
      if (data.status === 'done' && data.video?.url) {
        const videoRes = await fetch(data.video.url, { signal: controller.signal });
        if (!videoRes.ok) {
          throw new AppError(videoRes.status, `Grok 영상 다운로드 실패 (${videoRes.status})`);
        }
        const arrayBuffer = await videoRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      // Case 2: Asynchronous - poll until done
      if (data.request_id) {
        return await pollForCompletion(data.request_id, apiKey, controller.signal);
      }

      throw new AppError(500, 'Grok API 응답 형식이 예상과 다릅니다');
    } catch (err) {
      if (err instanceof AppError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('abort') || message.includes('timeout')) {
        throw new AppError(
          504,
          `Grok 영상 생성 타임아웃 (${VIDEO_GENERATION_TIMEOUT_MS / 1000}초 초과)`
        );
      }
      throw new AppError(500, `Grok 영상 생성 중 오류: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  },
};
