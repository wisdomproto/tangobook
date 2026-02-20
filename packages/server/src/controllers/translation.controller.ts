import { TranslationService } from '../services/translation.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const TranslationController = {
  translatePage: asyncHandler(async (req, res) => {
    const result = await TranslationService.translatePage(req.body);
    res.json({ success: true, data: result });
  }),

  translateBatch: asyncHandler(async (req, res) => {
    const results = await TranslationService.translateBatch(req.body);
    res.json({ success: true, data: results });
  }),
};
