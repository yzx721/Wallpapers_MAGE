import express from 'express';
import { getAlbumList, getAlbumDetail, deleteAlbum, createAlbum } from '../controllers/albumController.js';
import { authMiddleware as auth } from '../middleware/auth.js';
const router = express.Router();

router.get('/', getAlbumList).post('/', auth, createAlbum);
router.get('/:id', getAlbumDetail).delete('/:id', auth, deleteAlbum);

export default router;
