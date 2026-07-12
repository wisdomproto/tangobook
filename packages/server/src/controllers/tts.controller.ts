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

  // 어휘 게임 낱유닛(zh 한자·vi 어절·th 결합단위) 발음 — lazy 캐시. { text, lang } → { audioUrl }.
  vocabUnit: asyncHandler(async (req, res) => {
    const { text, lang } = req.body as { text?: string; lang?: string };
    const audioUrl = await TtsService.generateVocabUnit(text ?? '', lang ?? '');
    res.json({ success: true, data: { audioUrl } });
  }),

  // requireFile 미들웨어가 req.file 검증을 처리
  upload: asyncHandler(async (req, res) => {
    const audioUrl = await TtsService.uploadAudio(req.file!, req.body);
    res.json({ success: true, data: { audioUrl } });
  }),
};
