import { Expose } from 'class-transformer';

export class ApiResponseDto<T = any> {
  @Expose()
  data?: T;

  @Expose()
  error?: any;

  @Expose()
  detail?: any;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
