import { PromptPresetService } from '../services/prompt-preset.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { AppError } from '../middleware/error.middleware.js';

export const PromptPresetController = {
  list: asyncHandler(async (_req, res) => {
    const presets = await PromptPresetService.list();
    res.json({ success: true, data: presets });
  }),

  create: asyncHandler(async (req, res) => {
    const { name, systemPrompt } = req.body as { name?: string; systemPrompt?: string };
    if (!name || systemPrompt == null) {
      throw new AppError(400, 'name과 systemPrompt는 필수입니다.');
    }
    const preset = await PromptPresetService.create({ name, systemPrompt });
    res.status(201).json({ success: true, data: preset });
  }),

  update: asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const preset = await PromptPresetService.update(id, req.body);
    res.json({ success: true, data: preset });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    await PromptPresetService.remove(id);
    res.json({ success: true, data: { message: '프롬프트 프리셋이 삭제되었습니다.' } });
  }),
};
