import type { Request, Response } from 'express';
import { LongformService } from '../services/longform.service.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const LongformController = {
  analyze: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, promptPresetId, model } = req.body;
    const result = await LongformService.analyze(storybookId, projectId, promptPresetId, model);
    res.json({ success: true, data: result });
  }),

  getAnalyzeProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = LongformService.getAnalyzeProgress(projectId);
    res.json({ success: true, data: progress });
  },

  analyzeScene: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, sceneId, promptPresetId, model } = req.body;
    const result = await LongformService.analyzeScene(
      storybookId,
      projectId,
      sceneId,
      promptPresetId,
      model
    );
    res.json({ success: true, data: result });
  }),

  generateClip: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, sceneId } = req.body;
    const result = await LongformService.generateClip(storybookId, projectId, sceneId);
    res.json({ success: true, data: result });
  }),

  generateAll: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, startPage, endPage } = req.body;
    // Fire and forget - client polls progress
    LongformService.generateAll(storybookId, projectId, startPage, endPage).catch((err) => {
      console.error('[longform] generateAll error:', err);
    });
    res.json({ success: true, data: { message: '일괄 생성이 시작되었습니다.' } });
  }),

  getProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = LongformService.getProgress(projectId);
    res.json({ success: true, data: progress });
  },

  render: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    // Fire and forget - client polls progress
    LongformService.render(storybookId, projectId).catch((err) => {
      console.error('[longform] render error:', err);
    });
    res.json({ success: true, data: { message: '렌더링이 시작되었습니다.' } });
  }),

  getRenderProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = LongformService.getRenderProgress(projectId);
    res.json({ success: true, data: progress });
  },

  cancelRender: asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.body;
    const cancelled = LongformService.cancelRender(projectId);
    res.json({ success: true, data: { cancelled } });
  }),

  uploadBgm: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const result = await LongformService.uploadBgm(req.file!, storybookId, projectId);
    res.json({ success: true, data: result });
  }),

  // ----- YouTube -----
  youtubeAuthUrl: asyncHandler(async (_req: Request, res: Response) => {
    const url = YouTubeProvider.getAuthUrl();
    res.json({ success: true, data: { url } });
  }),

  youtubeCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Authorization code가 없습니다.' });
      return;
    }
    await YouTubeProvider.handleCallback(code);
    const clientUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/';
    res.redirect(`${clientUrl}?youtube=connected`);
  }),

  youtubeStatus: asyncHandler(async (_req: Request, res: Response) => {
    const connected = await YouTubeProvider.isConnected();
    res.json({ success: true, data: { connected } });
  }),

  youtubeDisconnect: asyncHandler(async (_req: Request, res: Response) => {
    await YouTubeProvider.disconnect();
    res.json({ success: true, data: { disconnected: true } });
  }),

  youtubeUpload: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, meta } = req.body;
    LongformService.uploadToYouTube(storybookId, projectId, meta).catch((err) => {
      console.error('[longform] YouTube upload error:', err);
    });
    res.json({ success: true, data: { message: 'YouTube 업로드가 시작되었습니다.' } });
  }),

  getYouTubeProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = LongformService.getYouTubeProgress(projectId);
    res.json({ success: true, data: progress });
  },

  generateYouTubeMeta: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, prompt } = req.body;
    const meta = await LongformService.generateYouTubeMeta(storybookId, projectId, prompt);
    res.json({ success: true, data: meta });
  }),

  recoverClips: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const result = await LongformService.recoverClips(storybookId, projectId);
    res.json({ success: true, data: result });
  }),
};
