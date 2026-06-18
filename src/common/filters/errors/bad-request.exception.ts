import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequestException extends HttpException {
  constructor(message?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    message
      ? super(message, HttpStatus.BAD_REQUEST)
      : super('Bad request.', HttpStatus.BAD_REQUEST);
  }
}
