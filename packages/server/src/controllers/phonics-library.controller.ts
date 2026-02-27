import { PhonicsLibraryService } from '../services/phonics-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const PhonicsLibraryController = {
  upload: asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'MP3 파일이 없습니다.' });
      return;
    }
    const { category } = req.body;
    const results = await PhonicsLibraryService.upload(files, category);
    res.json({ success: true, data: results });
  }),

  list: asyncHandler(async (_req, res) => {
    const data = await PhonicsLibraryService.list();
    res.json({ success: true, data });
  }),

  remove: asyncHandler(async (req, res) => {
    const category = req.params.category as string;
    const sound = req.params.sound as string;
    await PhonicsLibraryService.remove(category as 'mod_phonics' | 'mod_english', sound);
    res.json({ success: true });
  }),

  concat: asyncHandler(async (req, res) => {
    const { text, storybookId, identifier } = req.body;
    const result = await PhonicsLibraryService.concat(text, storybookId, identifier);
    res.json({ success: true, data: result });
  }),
};
