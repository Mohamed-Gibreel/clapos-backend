import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  logger = new Logger();

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const isDebug = process.env.NODE_ENV === 'development';
    response.status(status).json({
      error: {
        ...(isDebug && { detail: exception }),
        message: exception.name,
        errorCode: status,
      },
    });
  }
}
