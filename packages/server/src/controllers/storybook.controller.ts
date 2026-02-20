import { Request, Response, NextFunction } from 'express';
import { StorybookService } from '../services/storybook.service.js';
import type { GenerateStorybookRequest, GenerateStoryRequest } from '@tangobook/shared';

export const StorybookController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const storybooks = await StorybookService.list();
      res.json({ success: true, data: storybooks });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const storybook = await StorybookService.getById(req.params['id'] as string);
      if (!storybook) {
        res.status(404).json({ success: false, error: '동화책을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: storybook });
    } catch (err) {
      next(err);
    }
  },

  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const storybook = await StorybookService.save(req.body.storybook);
      res.json({ success: true, data: storybook });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await StorybookService.delete(req.params['id'] as string);
      res.json({ success: true, data: { message: '동화책이 삭제되었습니다.' } });
    } catch (err) {
      next(err);
    }
  },

  async generateStory(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as GenerateStoryRequest;
      const pages = await StorybookService.generateStory(body);
      res.json({ success: true, data: pages });
    } catch (err) {
      next(err);
    }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as GenerateStorybookRequest;
      const storybook = await StorybookService.generate(body);
      res.json({ success: true, data: storybook });
    } catch (err) {
      next(err);
    }
  },
};
