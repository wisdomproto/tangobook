import { Request, Response } from 'express';
import { ImageService } from '../services/image.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const ImageController = {
  generateCharacter: asyncHandler(async (req, res) => {
    const imageUrl = await ImageService.generateCharacter(req.body);
    res.json({ success: true, data: { imageUrl } });
  }),

  generateCover: asyncHandler(async (req, res) => {
    const imageUrl = await ImageService.generateCover(req.body);
    res.json({ success: true, data: { imageUrl } });
  }),

  generateIllustration: asyncHandler(async (req, res) => {
    const imageUrl = await ImageService.generateIllustration(req.body);
    res.json({ success: true, data: { imageUrl } });
  }),

  generateKeyObject: asyncHandler(async (req, res) => {
    const imageUrl = await ImageService.generateKeyObject(req.body);
    res.json({ success: true, data: { imageUrl } });
  }),

  generateVocabulary: asyncHandler(async (req, res) => {
    const results = await ImageService.generateVocabulary(req.body);
    res.json({ success: true, data: results });
  }),

  cleanup: asyncHandler(async (req, res) => {
    await ImageService.deleteImage(req.body.imageUrl);
    res.json({ success: true, data: { message: '이미지가 삭제되었습니다.' } });
  }),

  // requireFile 미들웨어가 req.file 검증을 처리
  upload: asyncHandler(async (req, res) => {
    const imageUrl = await ImageService.uploadImage(req.file!, req.body);
    res.json({ success: true, data: { imageUrl } });
  }),

  analyzeStyle: asyncHandler(async (req, res) => {
    const prompt = await ImageService.analyzeArtStyle(req.file!);
    res.json({ success: true, data: { prompt } });
  }),

  uploadAudio: asyncHandler(async (req, res) => {
    const audioUrl = await ImageService.uploadAudio(req.file!, req.body);
    res.json({ success: true, data: { audioUrl } });
  }),

  bgmList: asyncHandler(async (_req, res) => {
    const list = await ImageService.getBgmList();
    res.json({ success: true, data: list });
  }),
};
