import { SettingsService } from '../services/settings.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const SettingsController = {
  getTitleTemplates: asyncHandler(async (_req, res) => {
    const data = await SettingsService.getTitleTemplates();
    res.json({ success: true, data });
  }),

  addTitleTemplate: asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    const template = await SettingsService.addTitleTemplate(imageUrl);
    res.json({ success: true, data: template });
  }),

  removeTitleTemplate: asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await SettingsService.removeTitleTemplate(id);
    res.json({ success: true });
  }),
};
