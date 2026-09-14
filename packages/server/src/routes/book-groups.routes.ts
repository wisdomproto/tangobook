import { Router, type Request, type Response, type NextFunction } from 'express';
import { BookGroupsService } from '../services/book-groups.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await BookGroupsService.load() });
  } catch (err) {
    next(err);
  }
});

// body: BookGroupsDoc — 통째로 덮는다(편집 화면이 전체를 들고 있다).
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await BookGroupsService.save(req.body) });
  } catch (err) {
    next(err);
  }
});

export default router;
