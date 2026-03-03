import { CharacterLibraryService } from '../services/character-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const CharacterLibraryController = {
  list: asyncHandler(async (_req, res) => {
    const data = await CharacterLibraryService.list();
    res.json({ success: true, data });
  }),

  save: asyncHandler(async (req, res) => {
    const character = req.body;
    const saved = await CharacterLibraryService.save(character);
    res.json({ success: true, data: saved });
  }),

  updateByName: asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name as string);
    const updates = req.body;
    const result = await CharacterLibraryService.updateByName(name, updates);
    res.json({ success: true, data: result });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await CharacterLibraryService.remove(id);
    res.json({ success: true });
  }),

  removeAll: asyncHandler(async (_req, res) => {
    const result = await CharacterLibraryService.removeAll();
    res.json({ success: true, data: result });
  }),

  applyEnglishNames: asyncHandler(async (_req, res) => {
    const result = await CharacterLibraryService.applyEnglishNames();
    res.json({ success: true, data: result });
  }),
};
