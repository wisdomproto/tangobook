import type { Request, Response } from 'express';
import { AudiobookService } from '../services/audiobook.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const AudiobookController = {
  render: asyncHandler(async (req, res) => {
    const result = await AudiobookService.render(req.body);
    res.json({ success: true, data: result });
  }),

  getRenderProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getRenderProgress(projectId);
    res.json({ success: true, data: progress });
  },

  // YouTube — fire-and-forget upload
  youtubeUpload: asyncHandler(async (req, res) => {
    const { storybookId, projectId, meta } = req.body;
    // Return immediately, run upload in background
    res.json({ success: true, data: { message: 'YouTube 업로드 시작' } });

    AudiobookService.uploadToYouTube(storybookId, projectId, meta).catch((err) => {
      console.error('[audiobook-youtube] Upload failed:', err);
      AudiobookService.setYouTubeError(
        projectId,
        err instanceof Error ? err.message : '업로드 실패'
      );
    });
  }),

  getYouTubeProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getYouTubeProgress(projectId);
    res.json({ success: true, data: progress });
  },

  youtubeGenerateMeta: asyncHandler(async (req, res) => {
    const { storybookId, projectId, prompt } = req.body;
    const meta = await AudiobookService.generateYouTubeMeta(storybookId, projectId, prompt);
    res.json({ success: true, data: meta });
  }),
};
