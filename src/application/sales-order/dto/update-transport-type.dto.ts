import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTransportTypeDto {
  @ApiProperty({ description: 'ID do novo tipo de transporte' })
  @IsString()
  @IsNotEmpty()
  transportTypeId!: string;
}
