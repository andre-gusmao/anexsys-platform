import { IsString, IsUUID, Length } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(2, 50)
  code!: string;

  @IsString()
  legalName!: string;

  @IsString()
  displayName!: string;

  @IsUUID()
  actorUserId!: string;
}
