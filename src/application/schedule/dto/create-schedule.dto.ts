import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleDto {
  @IsDateString()
  scheduledDate!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'windowStart must be in HH:MM format.' })
  windowStart!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'windowEnd must be in HH:MM format.' })
  windowEnd!: string;
}
