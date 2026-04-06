import type { Request, Response } from 'express';
import { AudiobookService } from '../services/audiobook.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const AudiobookController = {
  render: asyncHandler(async (req, res) => {
    const { storybookId, projectId } = req.body;
    // Fire-and-forget: return immediately, run render in background
    res.json({ success: true, data: { message: '렌더링 시작' } });

    AudiobookService.render({ storybookId, projectId }).catch((err) => {
      console.error('[audiobook] Render failed:', err.message || err);
      // Error is already stored in renderProgressMap by service
    });
  }),

  getRenderProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getRenderProgress(projectId);
    res.json({ success: true, data: progress });
  },

  deleteRender: asyncHandler(async (req, res) => {
    await AudiobookService.deleteRender(req.body);
    res.json({ success: true, data: { message: '렌더링 파일 삭제 완료' } });
  }),

  // YouTube — fire-and-forget upload
  youtubeUpload: asyncHandler(async (req, res) => {
    const { storybookId, projectId, meta, channelId } = req.body;
    // Return immediately, run upload in background
    res.json({ success: true, data: { message: 'YouTube 업로드 시작' } });

    AudiobookService.uploadToYouTube(storybookId, projectId, meta, channelId).catch((err) => {
      console.error('[audiobook-youtube] Upload failed:', err.message || err);
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

  // Captions — fire-and-forget
  youtubeUploadCaptions: asyncHandler(async (req, res) => {
    const { storybookId, projectId, languages } = req.body;
    res.json({ success: true, data: { message: '자막 업로드 시작' } });

    AudiobookService.uploadCaptions(storybookId, projectId, languages).catch((err) => {
      console.error('[audiobook-caption] Upload failed:', err);
      AudiobookService.setCaptionError(
        projectId,
        err instanceof Error ? err.message : '자막 업로드 실패'
      );
    });
  }),

  getCaptionProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getCaptionProgress(projectId);
    res.json({ success: true, data: progress });
  },
};
