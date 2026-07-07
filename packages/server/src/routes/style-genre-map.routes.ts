import { Router } from 'express';
import { StyleGenreMapController } from '../controllers/style-genre-map.controller.js';

const router = Router();

router.get('/', StyleGenreMapController.get);
router.put('/', StyleGenreMapController.put);

export default router;
