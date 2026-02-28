import { SystemSoundsService } from '../services/system-sounds.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { SystemSoundLanguage, SystemSoundType } from '@tangobook/shared';

export const SystemSoundsController = {
  upload: asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'MP3 파일이 없습니다.' });
      return;
    }
    const language = req.body.language as SystemSoundLanguage;
    const type = req.body.type as SystemSoundType;
    const results = await SystemSoundsService.upload(files, language, type);
    res.json({ success: true, data: results });
  }),

  list: asyncHandler(async (_req, res) => {
    const data = await SystemSoundsService.list();
    res.json({ success: true, data });
  }),

  remove: asyncHandler(async (req, res) => {
    const language = req.params.language as SystemSoundLanguage;
    const type = req.params.type as SystemSoundType;
    const name = req.params.name as string;
    await SystemSoundsService.remove(language, type, name);
    res.json({ success: true });
  }),

  removeAll: asyncHandler(async (req, res) => {
    const language = req.params.language as SystemSoundLanguage;
    const type = req.params.type as SystemSoundType;
    const result = await SystemSoundsService.removeAll(language, type);
    res.json({ success: true, data: result });
  }),
};
