import { IsArray, IsString } from 'class-validator';

export class SetTransportTypesDto {
  @IsArray()
  @IsString({ each: true })
  transportTypeIds!: string[];
}
