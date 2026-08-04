import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from './api_response.dto';
import { ResultType } from '../result';
import { isObject } from 'class-validator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  logger = new Logger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data: any) => {
        // Handlers that stream a response directly (e.g. file downloads via
        // @Res()) write to `res` themselves and send headers before this
        // runs — wrapping their (typically undefined) return value would
        // overwrite the status code and attempt to re-send a closed response.
        if (res.headersSent) {
          return data;
        }

        if (typeof data?.isSuccess != 'undefined') {
          const result = data as ResultType<any, any>;
          if (result.isSuccess) {
            return new ApiResponseDto({
              data: result.value,
              error: undefined,
            });
          } else {
            res.statusCode = result.errorCode;
            this.logger.error(data.error);
            const isDebug = process.env.NODE_ENV === 'development';

            return new ApiResponseDto({
              ...(isDebug && { detail: data.error }),
              data: undefined,
              error: isObject(data.error) ? data.error : data.error.toString(),
            });
          }
        } else {
          res.statusCode = 500;
          return new ApiResponseDto({
            data: undefined,
            error: 'Something went wrong',
          });
        }
      }),
    );
  }
}
