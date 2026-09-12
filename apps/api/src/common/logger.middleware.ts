import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const { method, url } = request;
    const start = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - start;
      const logLine = `${method} ${url} ${statusCode} ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(logLine);
      } else if (statusCode >= 400) {
        this.logger.warn(logLine);
      } else {
        this.logger.log(logLine);
      }
    });

    next();
  }
}
