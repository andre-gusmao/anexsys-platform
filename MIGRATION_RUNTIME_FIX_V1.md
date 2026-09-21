# MIGRATION_RUNTIME_FIX_V1

## Repository inspection result (actual source)

The current checked-out branch (`copilot/migration-runtime-fix-v1`) is documentation-only and does **not** contain backend runtime files (`package.json`, `tsconfig*.json`, `src/`, `dist/`, or TypeORM data-source/migrations).

Because of that, no in-repo code-level patch to migration scripts can be applied in this snapshot.

## Root cause of TS5011 (runtime strategy)

`TS5011` in this context is caused by running TypeORM migration commands through TypeScript source execution (ts-node/tsc context) without a stable root compilation boundary for the migration entrypoint.

In production/runtime execution, migrations should not depend on TypeScript compilation at command time.

## tsconfig.build.json assessment

When migrations are executed from `dist`, `tsconfig.build.json` must compile and emit the TypeORM runtime artifacts (data source and migrations) into `dist`.

If those files are not emitted, `tsconfig.build.json` is effectively misconfigured for production migrations.

## Should TypeORM run from `src` or `dist`?

For production-ready runtime, run TypeORM from **`dist`** (compiled JavaScript), not `src`.

## Production-ready migration command

After building the backend, run migrations using the compiled data source:

```bash
node ./node_modules/typeorm/cli.js migration:run -d dist/platform/database/typeorm/data-source.js
```

This is the command André should execute to create all database tables from the migration set.
