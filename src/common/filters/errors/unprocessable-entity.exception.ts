import { HttpException, HttpStatus } from '@nestjs/common';

export class UnprocessableEntityException extends HttpException {
  constructor(message: string, code: string) {
    super(
      { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, message, code },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
