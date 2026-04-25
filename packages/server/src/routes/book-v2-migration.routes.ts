import { Router } from 'express';
import {
  scan,
  migrateOne,
  listBids,
  verifyOne,
  seedMeta,
} from '../controllers/book-v2-migration.controller.js';

const router = Router();

router.post('/scan', scan);
router.post('/migrate', migrateOne);
router.post('/list-bids', listBids);
router.post('/verify', verifyOne);
router.post('/seed-curriculum-meta', seedMeta);

export default router;
