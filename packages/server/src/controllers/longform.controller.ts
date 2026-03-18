import type { Request, Response } from 'express';
import { LongformService } from '../services/longform.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const LongformController = {
  analyze: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, promptPresetId } = req.body;
    const result = await LongformService.analyze(storybookId, projectId, promptPresetId);
    res.json({ success: true, data: result });
  }),

  analyzeScene: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, sceneId, promptPresetId } = req.body;
    const result = await LongformService.analyzeScene(
      storybookId,
      projectId,
      sceneId,
      promptPresetId
    );
    res.json({ success: true, data: result });
  }),

  generateClip: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId, sceneId } = req.body;
    const result = await LongformService.generateClip(storybookId, projectId, sceneId);
    res.json({ success: true, data: result });
  }),

  generateAll: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    // Fire and forget - client polls progress
    LongformService.generateAll(storybookId, projectId).catch((err) => {
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

  uploadBgm: asyncHandler(async (req: Request, res: Response) => {
    const { storybookId, projectId } = req.body;
    const result = await LongformService.uploadBgm(req.file!, storybookId, projectId);
    res.json({ success: true, data: result });
  }),
};
