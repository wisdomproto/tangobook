import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../services/image.service.js';

export const ImageController = {
  async generateCharacter(req: Request, res: Response, next: NextFunction) {
    try {
      const imageUrl = await ImageService.generateCharacter(req.body);
      res.json({ success: true, data: { imageUrl } });
    } catch (err) {
      next(err);
    }
  },

  async generateCover(req: Request, res: Response, next: NextFunction) {
    try {
      const imageUrl = await ImageService.generateCover(req.body);
      res.json({ success: true, data: { imageUrl } });
    } catch (err) {
      next(err);
    }
  },

  async generateIllustration(req: Request, res: Response, next: NextFunction) {
    try {
      const imageUrl = await ImageService.generateIllustration(req.body);
      res.json({ success: true, data: { imageUrl } });
    } catch (err) {
      next(err);
    }
  },

  async generateKeyObject(req: Request, res: Response, next: NextFunction) {
    try {
      const imageUrl = await ImageService.generateKeyObject(req.body);
      res.json({ success: true, data: { imageUrl } });
    } catch (err) {
      next(err);
    }
  },

  async generateVocabulary(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await ImageService.generateVocabulary(req.body);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },

  async cleanup(req: Request, res: Response, next: NextFunction) {
    try {
      await ImageService.deleteImage(req.body.imageUrl);
      res.json({ success: true, data: { message: '이미지가 삭제되었습니다.' } });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: '파일이 없습니다.' });
        return;
      }
      const imageUrl = await ImageService.uploadImage(req.file, req.body);
      res.json({ success: true, data: { imageUrl } });
    } catch (err) {
      next(err);
    }
  },

  async analyzeStyle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: '이미지 파일이 없습니다.' });
        return;
      }
      const prompt = await ImageService.analyzeArtStyle(req.file);
      res.json({ success: true, data: { prompt } });
    } catch (err) {
      next(err);
    }
  },

  async uploadAudio(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: '오디오 파일이 없습니다.' });
        return;
      }
      const audioUrl = await ImageService.uploadAudio(req.file, req.body);
      res.json({ success: true, data: { audioUrl } });
    } catch (err) {
      next(err);
    }
  },

  async bgmList(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await ImageService.getBgmList();
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  },
};
