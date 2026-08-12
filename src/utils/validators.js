import { body, validationResult } from 'express-validator';
import AppError from './AppError.js';

// 导出校验规则数组
export const registerValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 20 }).withMessage('用户名长度 2-20 位')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确'),

    body('password')
    .trim()
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 32 }).withMessage('密码长度6-32位'),

   // 改造错误处理，抛出自定义错误，交给全局异常中间件统一处理
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 拼接第一条错误信息抛出
      const errMsg = errors.array()[0].msg;
      return next(new AppError(errMsg, 400));
    }
    next();
  }
];
