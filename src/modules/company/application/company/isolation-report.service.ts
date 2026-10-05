import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantContext } from 'src/platform/tenancy/tenant-context';

export type IsolationTableReport = {
  tableName: string;
  hasTenantId: boolean;
  rlsEnabled: boolean;
  hasPolicy: boolean;
  protected: boolean;
};

@Injectable()
export class IsolationReportService {
  constructor(private readonly dataSource: DataSource) {}

  async buildReport(): Promise<{ tables: IsolationTableReport[]; unprotected: string[]; allProtected: boolean }> {
    return TenantContext.run({ tenantId: null, bypass: true }, async () => {
      const tables: Array<{ table_name: string }> = await this.dataSource.query(`
        SELECT c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname
      `);

      const reports: IsolationTableReport[] = [];
      for (const row of tables) {
        const flags: Array<{ relrowsecurity: boolean; relforcerowsecurity: boolean }> = await this.dataSource.query(
          `SELECT c.relrowsecurity, c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = $1`,
          [row.table_name],
        );
        const policies: Array<{ polname: string }> = await this.dataSource.query(
          `SELECT p.polname FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid WHERE c.relname = $1 AND p.polname = 'tenant_isolation'`,
          [row.table_name],
        );
        const rlsEnabled = Boolean(flags[0]?.relrowsecurity && flags[0]?.relforcerowsecurity);
        const hasPolicy = policies.length > 0;
        reports.push({
          tableName: row.table_name,
          hasTenantId: true,
          rlsEnabled,
          hasPolicy,
          protected: rlsEnabled && hasPolicy,
        });
      }

      const unprotected = reports.filter((item) => !item.protected).map((item) => item.tableName);
      return { tables: reports, unprotected, allProtected: unprotected.length === 0 };
    });
  }
}
