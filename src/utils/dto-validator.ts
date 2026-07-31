import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { createResultClass, ResultClass } from './result';
import { ValidationError } from '@nestjs/common';

export const convertToInstance = <T>(
  dtoClass: new (...args: any[]) => T,
  body: Record<string, any>,
): ResultClass<T, string[]> => {
  var instance = plainToInstance(dtoClass, body);
  var errors: ValidationError[] = [];

  if (Array.isArray(instance)) {
    errors = instance
      .map((user) =>
        validateSync(user, {
          skipMissingProperties: false,
          whitelist: true,
        }),
      )
      .flat();
  } else {
    errors = validateSync(instance as any, {
      skipMissingProperties: false,
      whitelist: true,
    });
  }

  var formattedErrors = errors.flatMap((error) => {
    return error.constraints
      ? Object.values(error.constraints || {})
      : error.children?.flatMap((er) => Object.values(er.constraints || {}));
  });

  var Result = createResultClass<T, string[]>();

  if (errors.length != 0)
    return Result.error({ error: formattedErrors as any, errorCode: 400 });
  return Result.success(instance);
};

type Result<T, TError> = ReturnType<typeof createResultClass<T, TError>>;

export const failResult = <T, TError>(
  result: Result<T, TError>,
  errors: TError,
) =>
  result.error({
    error: errors,
    errorCode: 999,
  });

export const successResult = <T, TError>(result: Result<T, TError>, value: T) =>
  result.success(value);
