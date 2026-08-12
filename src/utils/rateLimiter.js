import { rateLimit } from 'express-rate-limit';

export default rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
