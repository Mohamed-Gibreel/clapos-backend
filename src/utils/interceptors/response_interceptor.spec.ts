import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ErrorCode } from '../error-codes';
import { createResultClass } from '../result';
import { ResponseInterceptor } from './response_interceptor';

const run = async (handlerResult: unknown) => {
  const res = { statusCode: 200, headersSent: false };
  const context = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(handlerResult) };

  const interceptor = new ResponseInterceptor();
  jest.spyOn(interceptor.logger, 'error').mockImplementation(() => {});
  const body = await lastValueFrom(interceptor.intercept(context, next));
  return { body, res };
};

describe('ResponseInterceptor', () => {
  it('keeps an ErrorCode list as an array', async () => {
    const Result = createResultClass<unknown, ErrorCode[]>();
    const { body, res } = await run(
      Result.error({
        error: [ErrorCode.PRODUCT_SKU_CONFLICT],
        errorCode: 409,
      }),
    );

    expect(res.statusCode).toBe(409);
    expect(body.error).toEqual([ErrorCode.PRODUCT_SKU_CONFLICT]);
  });

  it('keeps an object error as-is', async () => {
    const Result = createResultClass<unknown, object>();
    const { body } = await run(
      Result.error({ error: { field: 'name' }, errorCode: 400 }),
    );

    expect(body.error).toEqual({ field: 'name' });
  });

  it('stringifies a primitive error', async () => {
    const Result = createResultClass<unknown, number>();
    const { body } = await run(Result.error({ error: 42, errorCode: 500 }));

    expect(body.error).toBe('42');
  });

  it('wraps a success value in data', async () => {
    const Result = createResultClass<{ id: string }, unknown>();
    const { body } = await run(Result.success({ id: 'p1' }));

    expect(body.data).toEqual({ id: 'p1' });
    expect(body.error).toBeUndefined();
  });
});
