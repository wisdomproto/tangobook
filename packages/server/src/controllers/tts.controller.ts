import { TtsService } from '../services/tts.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const TtsController = {
  generate: asyncHandler(async (req, res) => {
    const audioUrl = await TtsService.generate(req.body);
    res.json({ success: true, data: { audioUrl } });
  }),

  batch: asyncHandler(async (req, res) => {
    const results = await TtsService.batch(req.body);
    res.json({ success: true, data: results });
  }),

  // requireFile 미들웨어가 req.file 검증을 처리
  upload: asyncHandler(async (req, res) => {
    const audioUrl = await TtsService.uploadAudio(req.file!, req.body);
    res.json({ success: true, data: { audioUrl } });
  }),
};
