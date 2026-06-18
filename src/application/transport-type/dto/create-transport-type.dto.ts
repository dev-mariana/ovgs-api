import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTransportTypeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
