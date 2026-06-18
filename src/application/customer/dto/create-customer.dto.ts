import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  document!: string;

  @IsEmail()
  email!: string;
}
