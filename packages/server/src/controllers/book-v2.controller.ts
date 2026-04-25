import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import * as svc from '../services/book-v2.service.js';
import type { ReadingLevel, BookTextSlice, BookCharacter } from '@tangobook/shared';

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const ok = (res: Response, data: unknown) => res.json({ success: true, data });

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const validLevel = (v: unknown): ReadingLevel => {
  const s = asString(v);
  if (!s || !/^L[1-4]$/.test(s)) {
    throw new AppError(400, `invalid level: ${v}`);
  }
  return s as ReadingLevel;
};

// ────────────────────────────────────────────────────────────────────────────
// Library
// ────────────────────────────────────────────────────────────────────────────

export const listBooks = asyncHandler(async (_req, res) => {
  const index = await svc.listBooks();
  ok(res, index);
});

export const refreshIndex = asyncHandler(async (_req, res) => {
  const index = await svc.refreshLibraryIndex();
  ok(res, index);
});

// ────────────────────────────────────────────────────────────────────────────
// Book CRUD
// ────────────────────────────────────────────────────────────────────────────

export const getBook = asyncHandler(async (req, res) => {
  ok(res, await svc.getBook(req.params['bid'] as string));
});

export const createBook = asyncHandler(async (req, res) => {
  ok(res, await svc.createBook(req.body));
});

export const updateBookMeta = asyncHandler(async (req, res) => {
  ok(res, await svc.updateBookMeta(req.params['bid'] as string, req.body));
});

export const deleteBook = asyncHandler(async (req, res) => {
  await svc.deleteBook(req.params['bid'] as string);
  ok(res, { deleted: true });
});

// ────────────────────────────────────────────────────────────────────────────
// usedVariants
// ────────────────────────────────────────────────────────────────────────────

export const patchVariants = asyncHandler(async (req, res) => {
  ok(res, await svc.patchVariants(req.params['bid'] as string, req.body));
});

// ────────────────────────────────────────────────────────────────────────────
// Text slice
// ────────────────────────────────────────────────────────────────────────────

export const getText = asyncHandler(async (req, res) => {
  const level = validLevel(req.params['level'] as string);
  ok(res, await svc.getText(req.params['bid'] as string, level, req.params['lang'] as string));
});

export const saveText = asyncHandler(async (req, res) => {
  const level = validLevel(req.params['level'] as string);
  const slice = req.body as BookTextSlice;
  ok(
    res,
    await svc.saveText(req.params['bid'] as string, level, req.params['lang'] as string, slice)
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Style slice
// ────────────────────────────────────────────────────────────────────────────

export const getStyle = asyncHandler(async (req, res) => {
  ok(res, await svc.getStyle(req.params['bid'] as string, req.params['style'] as string));
});

export const getCharacters = asyncHandler(async (req, res) => {
  ok(res, await svc.getCharacters(req.params['bid'] as string, req.params['style'] as string));
});

export const saveCharacters = asyncHandler(async (req, res) => {
  const characters = req.body as BookCharacter[];
  if (!Array.isArray(characters)) throw new AppError(400, 'body must be array');
  ok(
    res,
    await svc.saveCharacters(req.params['bid'] as string, req.params['style'] as string, characters)
  );
});

export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'image required');
  const result = await svc.uploadStyleImage({
    bid: req.params['bid'] as string,
    style: req.params['style'] as string,
    kind: 'cover',
    imageBuffer: req.file.buffer,
  });
  ok(res, result);
});

export const uploadKeyObject = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'image required');
  const result = await svc.uploadStyleImage({
    bid: req.params['bid'] as string,
    style: req.params['style'] as string,
    kind: 'keyObj',
    refId: req.params['refId'] as string,
    imageBuffer: req.file.buffer,
  });
  ok(res, result);
});

export const uploadVocab = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'image required');
  const result = await svc.uploadStyleImage({
    bid: req.params['bid'] as string,
    style: req.params['style'] as string,
    kind: 'vocab',
    refId: req.params['refId'] as string,
    imageBuffer: req.file.buffer,
  });
  ok(res, result);
});

// ────────────────────────────────────────────────────────────────────────────
// Audiobook
// ────────────────────────────────────────────────────────────────────────────

export const getAudiobookProject = asyncHandler(async (req, res) => {
  ok(res, await svc.getAudiobookProject(req.params['bid'] as string));
});

export const saveAudiobookProject = asyncHandler(async (req, res) => {
  ok(res, await svc.saveAudiobookProject(req.params['bid'] as string, req.body));
});

export const listAudiobookRenders = asyncHandler(async (req, res) => {
  ok(res, await svc.getAudiobookRenders(req.params['bid'] as string));
});

export const startAudiobookRender = asyncHandler(async (req, res) => {
  const { level, language, style } = req.body as {
    level?: string;
    language?: string;
    style?: string;
  };
  const lv = validLevel(level);
  if (!language || !style) throw new AppError(400, 'language and style required');
  const result = await svc.startAudiobookRender({
    bid: req.params['bid'] as string,
    level: lv,
    language,
    style,
  });
  ok(res, result);
});

export const getAudiobookRenderProgress = asyncHandler(async (req, res) => {
  const taskId = asString(req.query.taskId);
  if (!taskId) throw new AppError(400, 'taskId required');
  const progress = svc.getAudiobookRenderProgress(req.params['bid'] as string, taskId);
  ok(res, progress);
});

export const uploadPageImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'image required');
  const level = validLevel(req.params['level']);
  const result = await svc.uploadStyleImage({
    bid: req.params['bid'] as string,
    style: req.params['style'] as string,
    kind: 'page',
    level,
    illustrationKey: req.params['illustrationKey'] as string,
    imageBuffer: req.file.buffer,
  });
  ok(res, result);
});

// ────────────────────────────────────────────────────────────────────────────
// Longform
// ────────────────────────────────────────────────────────────────────────────

export const listLongform = asyncHandler(async (req, res) => {
  const level = req.query.level ? validLevel(req.query.level) : undefined;
  const language = asString(req.query.lang);
  const style = asString(req.query.style);
  ok(res, await svc.listLongform(req.params['bid'] as string, { level, language, style }));
});

export const getLongform = asyncHandler(async (req, res) => {
  ok(res, await svc.getLongform(req.params['bid'] as string, req.params['projectId'] as string));
});

export const createLongform = asyncHandler(async (req, res) => {
  const { level, language, style, parentProjectId } = req.body as {
    level?: string;
    language?: string;
    style?: string;
    parentProjectId?: string;
  };
  const lv = validLevel(level);
  if (!language || !style) throw new AppError(400, 'language and style required');
  const result = await svc.createLongform({
    bid: req.params['bid'] as string,
    level: lv,
    language,
    style,
    parentProjectId,
  });
  ok(res, result);
});

export const saveLongform = asyncHandler(async (req, res) => {
  ok(
    res,
    await svc.saveLongform(req.params['bid'] as string, req.params['projectId'] as string, req.body)
  );
});

export const deleteLongform = asyncHandler(async (req, res) => {
  await svc.deleteLongform(req.params['bid'] as string, req.params['projectId'] as string);
  ok(res, { deleted: true });
});

// ────────────────────────────────────────────────────────────────────────────
// Games
// ────────────────────────────────────────────────────────────────────────────

export const listGames = asyncHandler(async (req, res) => {
  const level = req.query.level ? validLevel(req.query.level) : undefined;
  const language = asString(req.query.lang);
  ok(res, await svc.listGames(req.params['bid'] as string, { level, language }));
});

// ────────────────────────────────────────────────────────────────────────────
// Runtime payloads
// ────────────────────────────────────────────────────────────────────────────

export const runtimeViewer = asyncHandler(async (req, res) => {
  const level = validLevel(req.query.level);
  const language = asString(req.query.lang);
  const style = asString(req.query.style);
  if (!language || !style) throw new AppError(400, 'lang and style required');
  ok(res, await svc.getRuntimeViewer(req.params['bid'] as string, level, language, style));
});

export const runtimeGame = asyncHandler(async (req, res) => {
  const style = asString(req.query.style);
  if (!style) throw new AppError(400, 'style required');
  ok(
    res,
    await svc.getRuntimeGame(req.params['bid'] as string, req.params['gameId'] as string, style)
  );
});
