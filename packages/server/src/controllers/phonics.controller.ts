import { PhonicsService } from '../services/phonics.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { GeneratePhonicsBookRequest } from '@tangobook/shared';

export const PhonicsController = {
  generate: asyncHandler(async (req, res) => {
    const body = req.body as GeneratePhonicsBookRequest;
    const storybook = await PhonicsService.generate(body);
    res.json({ success: true, data: storybook });
  }),
};
