import { logger } from './loggerHelper.js';
import AppError from './AppError.js';

export default function globalErrorHandler(err, req, res, next) {
  // Multer 文件大小超限
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '文件大小超过 20MB 限制' });
  }

  // AppError：已知业务错误
  if (err instanceof AppError) {
    logger.warn({
      traceId: req.traceId,
      userId: req.user?.id,
      path: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode,
      name: err.name,
      message: err.message,
    });
    return res.status(err.statusCode).json({ error: err.message });
  }

  // 未知错误：记录完整 stack
  logger.error({
    traceId: req.traceId,
    userId: req.user?.id,
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({ error: '服务器内部错误' });
}
