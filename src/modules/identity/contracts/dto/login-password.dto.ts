import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginPasswordDto {
  @IsUUID()
  tenantId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
