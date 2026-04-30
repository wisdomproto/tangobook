import type { Request, Response, NextFunction } from 'express';
import type { Lang } from '@tangobook/shared';
import { PlaygroundService } from '../services/playground.service.js';

export const PlaygroundController = {
  /** 클라이언트가 Supabase RPC `get_sr_word_pool` 호출 결과를 보내 enrich 받음 */
  async enrichWordPool(req: Request, res: Response, next: NextFunction) {
    try {
      const records = req.body?.records;
      if (!Array.isArray(records)) {
        res.status(400).json({ success: false, error: 'records[] required' });
        return;
      }
      const enriched = await PlaygroundService.enrichWordPool(records);
      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /** 신규 사용자(마스터리 비어있음) 대비 — vocabulary-db 에서 무작위 sample */
  async sampleWords(req: Request, res: Response, next: NextFunction) {
    try {
      const language = (req.query.language as Lang) ?? 'ko';
      const count = Number(req.query.count ?? 10);
      const excludeWords = ((req.query.exclude as string) ?? '').split(',').filter(Boolean);
      const items = await PlaygroundService.sampleFromVocabulary(language, count, excludeWords);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },
};
