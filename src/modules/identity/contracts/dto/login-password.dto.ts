import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginPasswordDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
