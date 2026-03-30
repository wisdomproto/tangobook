import type { Request, Response } from 'express';
import { LongformService } from '../services/longform.service.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const LongformController = {
  analyze: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, promptPresetId, model, excludePages } = req.body;
    const result = await LongformService.analyze(
      storybookId,
      projectId,
      promptPresetId,
      model,
      excludePages
    );
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
      LongformService.setRenderError(projectId, err instanceof Error ? err.message : '렌더링 실패');
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

  deleteRender: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    await LongformService.deleteRender(storybookId, projectId);
    res.json({ success: true, data: { message: '렌더링 파일 삭제 완료' } });
  }),

  uploadClip: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, sceneId } = req.body;
    const result = await LongformService.uploadClip(req.file!, storybookId, projectId, sceneId);
    res.json({ success: true, data: result });
  }),

  uploadBgm: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const result = await LongformService.uploadBgm(req.file!, storybookId, projectId);
    res.json({ success: true, data: result });
  }),

  // ----- YouTube -----
  youtubeAuthUrl: asyncHandler(async (req: Request, res: Response) => {
    const channelName = (req.query.name as string) || '';
    const url = YouTubeProvider.getAuthUrl(channelName);
    res.json({ success: true, data: { url } });
  }),

  youtubeCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error('[youtube] OAuth error:', error, req.query);
      res.status(400).json({ success: false, error: `Google OAuth 오류: ${error}` });
      return;
    }
    if (!code || typeof code !== 'string') {
      console.error('[youtube] No code in callback. Query:', req.query);
      res.status(400).json({ success: false, error: 'Authorization code가 없습니다.' });
      return;
    }
    const channelName = typeof state === 'string' ? state : '';
    await YouTubeProvider.handleCallback(code, channelName);
    const clientUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/';
    res.redirect(`${clientUrl}?youtube=connected`);
  }),

  youtubeStatus: asyncHandler(async (_req: Request, res: Response) => {
    const connected = await YouTubeProvider.isConnected();
    res.json({ success: true, data: { connected } });
  }),

  youtubeChannels: asyncHandler(async (_req: Request, res: Response) => {
    const channels = await YouTubeProvider.listChannels();
    res.json({ success: true, data: channels });
  }),

  youtubeRemoveChannel: asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.body;
    await YouTubeProvider.removeChannel(channelId);
    res.json({ success: true, data: { removed: true } });
  }),

  youtubeDisconnect: asyncHandler(async (_req: Request, res: Response) => {
    await YouTubeProvider.disconnect();
    res.json({ success: true, data: { disconnected: true } });
  }),

  youtubeUpload: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, meta, channelId } = req.body;
    LongformService.uploadToYouTube(storybookId, projectId, meta, channelId).catch((err) => {
      console.error('[longform] YouTube upload error:', err);
      // 클라이언트 polling에서 감지할 수 있도록 실패 기록
      LongformService.setYouTubeError(
        projectId,
        err instanceof Error ? err.message : 'YouTube 업로드 실패'
      );
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

  prepareRender: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    // Fire and forget - client polls renderProgress
    LongformService.prepareRender(storybookId, projectId).catch((err) => {
      console.error('[longform] prepareRender error:', err);
    });
    res.json({ success: true, data: { message: '씬 전처리가 시작되었습니다.' } });
  }),

  renderManifest: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const manifest = await LongformService.renderManifest(storybookId, projectId);
    res.json({ success: true, data: manifest });
  }),

  presignedUpload: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const result = await LongformService.presignedUpload(storybookId, projectId);
    res.json({ success: true, data: result });
  }),

  confirmRender: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, outputUrl } = req.body;
    const result = await LongformService.confirmRender(storybookId, projectId, outputUrl);
    res.json({ success: true, data: result });
  }),

  // Captions — fire-and-forget
  youtubeUploadCaptions: asyncHandler(async (req, res) => {
    const { storybookId, projectId, languages } = req.body;
    res.json({ success: true, data: { message: '자막 업로드 시작' } });

    LongformService.uploadCaptions(storybookId, projectId, languages).catch((err) => {
      console.error('[longform-caption] Upload failed:', err);
      LongformService.setCaptionError(
        projectId,
        err instanceof Error ? err.message : '자막 업로드 실패'
      );
    });
  }),

  getCaptionProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = LongformService.getCaptionProgress(projectId);
    res.json({ success: true, data: progress });
  },
};
