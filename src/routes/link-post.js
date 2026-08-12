import express from 'express';
import {
    getLinkPosts,
    getLinkPostDetail,
    createLinkPost,
    deleteLinkPost
} from '../controllers/linkPostController.js';
import { optionalAuthMiddleware as optionalAuth } from '../middleware/auth.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLinkPosts);
router.get('/:id',optionalAuth, getLinkPostDetail);
router.post('/', auth, createLinkPost);
router.delete('/:id', auth, deleteLinkPost);

export default router;
