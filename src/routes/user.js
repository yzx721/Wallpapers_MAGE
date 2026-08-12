import express from 'express';
import {getUserById,getUserWork} from '../controllers/UserController.js';
import { registerValidator } from '../utils/validators.js';
import { registerUser, loginUser } from '../controllers/UserController.js';
import {refreshAuthMiddleware} from '../middleware/auth.js';
import {generateAccessToken} from '../utils/jwtHelper.js';
const router = express.Router();

router.post('/register', registerValidator, registerUser);
router.post('/login', loginUser);
// 刷新token接口，只用refresh中间件
router.post('/token/refresh', refreshAuthMiddleware, async (req, res) => {
  const newAccessToken = await generateAccessToken(req.RefreshUser);
  res.json({ code: 200, msg: '刷新凭证有效',
    data:{
      accessToken: newAccessToken
    }
   });
});
router.get('/:id', getUserById);
router.get('/:id/work', getUserWork);
export default router;
