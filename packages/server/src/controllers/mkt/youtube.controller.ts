import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { YouTubeProvider } from '../../providers/youtube.provider.js';

/** GET /api/mkt/youtube/status — 연결된 유튜브 채널(오디오북/롱폼과 공용) 상태. */
export const youtubeStatus = asyncHandler(async (_req: Request, res: Response) => {
  const channels = await YouTubeProvider.listChannels().catch(() => []);
  res.json({ success: true, connected: channels.length > 0, channels });
});
