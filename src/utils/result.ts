import { Logger } from '@nestjs/common';

export type ResultType<T, E> = InstanceType<
  ReturnType<typeof createResultClass<T, E>>
>;

export const createResultClass = <T, TError>() => {
  return class Result {
    static #isConstructedStatically = false;

    #value: T | undefined = undefined;
    #error: TError | undefined = undefined;
    #errorCode: number | undefined = undefined;

    static #logger = new Logger();

    isSuccess: boolean = false;

    constructor({
      isSuccess,
      value,
      error,
      errorCode,
    }: {
      isSuccess: boolean;
      value: T | undefined;
      error: TError | undefined;
      errorCode: number | undefined;
    }) {
      if (!Result.#isConstructedStatically) {
        throw Error('Result class is not constructable');
      }

      this.#error = error;
      this.#value = value;
      this.#errorCode = errorCode;
      this.isSuccess = isSuccess;

      Result.#isConstructedStatically = false;
    }

    static success(value: T) {
      Result.#isConstructedStatically = true;
      return new Result({
        isSuccess: true,
        value: value,
        error: undefined,
        errorCode: undefined,
      });
    }

    static error({ errorCode, error }: { errorCode: number; error: TError }) {
      Result.#isConstructedStatically = true;
      this.#logger.error(`Error ${errorCode}: ${error}`);
      return new Result({
        isSuccess: false,
        value: undefined,
        error: error,
        errorCode: errorCode,
      });
    }

    get value(): T {
      if (!this.isSuccess) throw Error('Result is not successful');
      return this.#value as T;
    }

    get error(): TError {
      if (this.isSuccess) throw Error('Result is successful');
      return this.#error as TError;
    }

    get errorCode(): number {
      if (this.isSuccess) throw Error('Result is successful');
      return this.#errorCode as number;
    }
  };
};

export type ResultClass<T, TError> = InstanceType<
  ReturnType<() => ReturnType<typeof createResultClass<T, TError>>>
>;
