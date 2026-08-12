import express from 'express';
import {
    toggleLikeController,
    postCommentController,
    getCommentsListController
} from '../controllers/likes_commentController.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:targetType/:targetId/like', auth, toggleLikeController);
router.post('/:targetType/:targetId/comments', auth, postCommentController);
router.get('/:targetType/:targetId/comments', getCommentsListController);

export default router;
