import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from 'src/modules/authorization/authorization.module';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { PasswordHasherService } from 'src/platform/auth/password-hasher.service';
import { TokenFactoryService } from 'src/platform/auth/token-factory.service';
import { AuthService } from './application/auth/auth.service';
import { IdentityService } from './application/identity/identity.service';
import { UserCredentialEntity } from './infrastructure/persistence/entities/user-credential.entity';
import { UserIdentityEntity } from './infrastructure/persistence/entities/user-identity.entity';
import { UserSessionEntity } from './infrastructure/persistence/entities/user-session.entity';
import { UserCredentialRepository } from './infrastructure/persistence/repositories/user-credential.repository';
import { UserIdentityRepository } from './infrastructure/persistence/repositories/user-identity.repository';
import { UserSessionRepository } from './infrastructure/persistence/repositories/user-session.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserIdentityEntity, UserCredentialEntity, UserSessionEntity]),
    AuditModule,
    TenantModule,
    BranchModule,
    forwardRef(() => AuthorizationModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'anexsys-dev-secret'),
      }),
    }),
  ],
  providers: [
    IdentityService,
    AuthService,
    UserIdentityRepository,
    UserCredentialRepository,
    UserSessionRepository,
    PasswordHasherService,
    TokenFactoryService,
  ],
  exports: [
    IdentityService,
    AuthService,
    UserIdentityRepository,
    UserCredentialRepository,
    UserSessionRepository,
    PasswordHasherService,
    TokenFactoryService,
  ],
})
export class IdentityModule {}
