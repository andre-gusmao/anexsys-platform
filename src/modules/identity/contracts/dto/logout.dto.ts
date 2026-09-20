import { IsUUID } from 'class-validator';

export class LogoutDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  actorUserId!: string;
}
