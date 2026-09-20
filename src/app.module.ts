import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { AuditModule } from './modules/audit/audit.module';
import { BranchModule } from './modules/branch/branch.module';
import { CrmModule } from './modules/crm/crm.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OperationalResourcesModule } from './modules/operational-resources/operational-resources.module';
import { ProductionOrdersModule } from './modules/production-orders/production-orders.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { JwtAuthGuard } from './platform/auth/jwt-auth.guard';
import { PermissionsGuard } from './platform/auth/permissions.guard';
import { RequestContextMiddleware } from './platform/http/request-context.middleware';
import { buildTypeOrmOptions } from './platform/database/typeorm/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: buildTypeOrmOptions,
    }),
    AuditModule,
    TenantModule,
    BranchModule,
    CrmModule,
    ServiceOrdersModule,
    OperationalResourcesModule,
    ProductionOrdersModule,
    IdentityModule,
    AuthorizationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
