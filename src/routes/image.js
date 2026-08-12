import express from 'express';
import { getImageList, getImageDetail, deleteImage, uploadImage } from '../controllers/imageController.js';
import upload from '../utils/multerConfig.js';
import { authMiddleware as auth, optionalAuthMiddleware as optionalAuth } from '../middleware/auth.js';

const router = express.Router();

//post,delete接口需要验证用户身份；get 详情用可选鉴权（匿名可看，登录后返回 liked）
router.get('/', getImageList).post('/', auth, upload.single('file'), uploadImage);
router.get('/:id', optionalAuth, getImageDetail).delete('/:id', auth, deleteImage);

export default router;