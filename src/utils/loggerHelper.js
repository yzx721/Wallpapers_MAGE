import pino from 'pino';
import pinoHttp from 'pino-http';

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      level: 'info',
      options: {
        destination: './logs/all-logs.log',
        mkdir: true,
      },
    },
    {
      target: 'pino/file',
      level: 'error',
      options: {
        destination: './logs/errors.log',
        mkdir: true,
      },
    },
    {
      target: 'pino-pretty',
      level: 'info',
      options: {
        colorize: true,
      },
    },
  ],
});

export const logger = pino(transport);
export const pinoHttpMiddleware = pinoHttp({
  logger,
  customLogLevel: function (_req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        ip: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    }
  }
});