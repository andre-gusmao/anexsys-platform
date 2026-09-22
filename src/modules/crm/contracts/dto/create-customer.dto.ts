import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CustomerType } from 'src/shared/domain/enums';

export class CreateCustomerDto {
  @IsUUID()
  tenantId!: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsString()
  fullName!: string;

  @IsString()
  mobilePhone!: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  cpf?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  postalCode?: string;

  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  district!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsUUID()
  actorUserId!: string;
}
