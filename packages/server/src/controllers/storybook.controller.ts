import { StorybookService } from '../services/storybook.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { GenerateStorybookRequest, GenerateStoryRequest } from '@tangobook/shared';

export const StorybookController = {
  list: asyncHandler(async (_req, res) => {
    const storybooks = await StorybookService.list();
    res.json({ success: true, data: storybooks });
  }),

  getById: asyncHandler(async (req, res) => {
    const storybook = await StorybookService.getById(req.params['id'] as string);
    if (!storybook) {
      res.status(404).json({ success: false, error: '동화책을 찾을 수 없습니다.' });
      return;
    }
    res.json({ success: true, data: storybook });
  }),

  save: asyncHandler(async (req, res) => {
    const storybook = await StorybookService.save(req.body.storybook);
    res.json({ success: true, data: storybook });
  }),

  delete: asyncHandler(async (req, res) => {
    await StorybookService.delete(req.params['id'] as string);
    res.json({ success: true, data: { message: '동화책이 삭제되었습니다.' } });
  }),

  copy: asyncHandler(async (req, res) => {
    const storybook = await StorybookService.copy(req.params['id'] as string);
    res.json({ success: true, data: storybook });
  }),

  generateStory: asyncHandler(async (req, res) => {
    const body = req.body as GenerateStoryRequest;
    const pages = await StorybookService.generateStory(body);
    res.json({ success: true, data: pages });
  }),

  generate: asyncHandler(async (req, res) => {
    const body = req.body as GenerateStorybookRequest;
    const storybook = await StorybookService.generate(body);
    res.json({ success: true, data: storybook });
  }),

  simplifyKeyObjects: asyncHandler(async (_req, res) => {
    const result = await StorybookService.simplifyKeyObjectNames();
    res.json({ success: true, data: result });
  }),
};
