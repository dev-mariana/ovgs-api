import { HttpException, HttpStatus } from '@nestjs/common';

export class ConflictException extends HttpException {
  constructor() {
    super('Resource already exists.', HttpStatus.CONFLICT);
  }
}
