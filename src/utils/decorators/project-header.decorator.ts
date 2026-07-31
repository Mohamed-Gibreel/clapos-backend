import { ApiHeader } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

type Option = {
  required?: boolean;
};

export function ApiProjectHeader(options?: Option) {
  let required = options?.required ?? false;

  return applyDecorators(
    ApiHeader({
      name: 'x-project-id',
      description: 'Project ID to scope the request',
      required: required,
    }),
  );
}
