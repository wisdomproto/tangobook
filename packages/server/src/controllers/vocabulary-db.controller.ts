import { VocabularyDbService } from '../services/vocabulary-db.service.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { AppError } from '../middleware/error.middleware.js';
import type { VocabSourceType } from '@tangobook/shared';

export const VocabularyDbController = {
  list: asyncHandler(async (req, res) => {
    const { query, storybookId, sourceType } = req.query;
    const data = await VocabularyDbService.search({
      query: query as string | undefined,
      storybookId: storybookId as string | undefined,
      sourceType: sourceType as VocabSourceType | undefined,
    });
    res.json({ success: true, data });
  }),

  getByWord: asyncHandler(async (req, res) => {
    const word = decodeURIComponent(req.params.word as string);
    const entry = await VocabularyDbService.getByWord(word);
    if (!entry) throw new AppError(404, '단어를 찾을 수 없습니다.');
    res.json({ success: true, data: entry });
  }),

  getByStorybook: asyncHandler(async (req, res) => {
    const storybookId = req.params.storybookId as string;
    const data = await VocabularyDbService.getByStorybookId(storybookId);
    res.json({ success: true, data });
  }),

  syncFromStorybook: asyncHandler(async (req, res) => {
    const { storybookId } = req.body;
    if (!storybookId) throw new AppError(400, 'storybookId가 필요합니다.');
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');
    const result = await VocabularyDbService.syncFromStorybook(storybook);
    res.json({ success: true, data: result });
  }),

  bulkSync: asyncHandler(async (_req, res) => {
    const result = await VocabularyDbService.bulkSyncAll();
    res.json({ success: true, data: result });
  }),

  reset: asyncHandler(async (_req, res) => {
    await VocabularyDbService.reset();
    res.json({ success: true, data: { message: 'Vocabulary DB가 초기화되었습니다.' } });
  }),
};
