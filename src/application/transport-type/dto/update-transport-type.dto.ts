import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTransportTypeDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
