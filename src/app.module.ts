import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { AuditModule } from './modules/audit/audit.module';
import { BranchModule } from './modules/branch/branch.module';
import { CompanyModule } from './modules/company/company.module';
import { CrmModule } from './modules/crm/crm.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OperationalResourcesModule } from './modules/operational-resources/operational-resources.module';
import { ProductionOrdersModule } from './modules/production-orders/production-orders.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { QualityModule } from './modules/quality/quality.module';
import { ReworkModule } from './modules/rework/rework.module';
import { WarrantyModule } from './modules/warranty/warranty.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { CustodyModule } from './modules/custody/custody.module';
import { JwtAuthGuard } from './platform/auth/jwt-auth.guard';
import { PermissionsGuard } from './platform/auth/permissions.guard';
import { RequestContextMiddleware } from './platform/http/request-context.middleware';
import { buildTypeOrmOptions } from './platform/database/typeorm/typeorm.config';
import { PickupModule } from './modules/pickup/pickup.module';
import { CustomerPortalModule } from './modules/customer-portal/customer-portal.module';
import { SmartConciergeModule } from './modules/smart-concierge/smart-concierge.module';
import { TenantRlsInterceptor } from './platform/tenancy/tenant-rls.interceptor';
import { patchPostgresQueryRunnerForRls } from './platform/tenancy/tenant-rls.patch';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: buildTypeOrmOptions,
    }),
    AuditModule,
    TenantModule,
    CompanyModule,
    BranchModule,
    CrmModule,
    ServiceOrdersModule,
    OperationalResourcesModule,
    ProductionOrdersModule,
    QualityModule,
    ReworkModule,
    WarrantyModule,
    FinanceModule,
    FiscalModule,
    CustodyModule,
    PickupModule,
    CustomerPortalModule,
    SmartConciergeModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRlsInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  onModuleInit(): void {
    patchPostgresQueryRunnerForRls();
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
